const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  awardXp,
  xpRequiredForLevel,
  bossUnlockProgress,
  totalEngagementXp,
} = require("../.game-check/domain/legacyProgression");
const { activateQuest, completeQuest } = require("../.game-check/domain/game");
const {
  gameReducer,
  initialGameState,
} = require("../.game-check/state/gameReducer");
const { mockGame } = require("../.game-check/data/mockGame");
const { mockGameService } = require("../.game-check/services/gameService");

const freshGame = () => structuredClone(mockGame);

test("the initial profile matches the requested MVP and the XP curve", () => {
  const { player, world, boss } = freshGame();
  assert.equal(player.name, "Janailson");
  assert.equal(player.level, 3);
  assert.equal(player.xp, 420);
  assert.equal(player.streak, 4);
  assert.equal(xpRequiredForLevel(player.level), 500);
  assert.equal(world.name, "THE COMEBACK");
  assert.equal(boss.name, "THE SILENCE");
});

test("completion awards XP and marks a quest without mutating the source", () => {
  const game = freshGame();
  const before = structuredClone(game);
  const result = completeQuest(game, "train-your-ears");
  assert.equal(result.snapshot.player.xp, 435);
  assert.equal(result.snapshot.quests[0].status, "completed");
  assert.equal(result.feedback.xpAwarded, 15);
  assert.deepEqual(game, before);
});

test("a quest can be activated and completed exactly once", () => {
  const active = activateQuest(freshGame(), "speak-up");
  assert.equal(active.quests[1].status, "active");
  const first = completeQuest(active, "speak-up");
  const second = completeQuest(first.snapshot, "speak-up");
  assert.equal(first.snapshot.player.xp, 440);
  assert.equal(second.snapshot, first.snapshot);
  assert.equal(second.feedback, null);
  assert.equal(activateQuest(second.snapshot, "speak-up"), second.snapshot);
});

test("locked and unknown quests cannot be activated or rewarded", () => {
  const game = freshGame();
  game.quests[0].status = "locked";
  for (const id of ["train-your-ears", "missing-quest"]) {
    assert.equal(activateQuest(game, id), game);
    assert.deepEqual(completeQuest(game, id), {
      snapshot: game,
      feedback: null,
    });
  }
});

test("level up happens exactly at the requirement", () => {
  assert.deepEqual(awardXp(3, 480, 20), { level: 4, xp: 0, levelsGained: 1 });
  assert.equal(xpRequiredForLevel(4), 600);
});

test("level up carries excess XP into the next level", () => {
  assert.deepEqual(awardXp(3, 490, 20), { level: 4, xp: 10, levelsGained: 1 });
});

test("a reward can cross multiple levels and preserve all XP", () => {
  const result = awardXp(3, 490, 1210);
  assert.deepEqual(result, { level: 5, xp: 600, levelsGained: 2 });
  assert.equal(
    totalEngagementXp(3, 490) + 1210,
    totalEngagementXp(result.level, result.xp),
  );
});

test("zero XP is valid, but invalid XP and levels are rejected", () => {
  assert.deepEqual(awardXp(3, 420, 0), { level: 3, xp: 420, levelsGained: 0 });
  for (const reward of [-1, NaN, Infinity, 0.5])
    assert.throws(() => awardXp(3, 420, reward), RangeError);
  for (const level of [0, -1, NaN, 1.5])
    assert.throws(() => xpRequiredForLevel(level), RangeError);
  assert.throws(() => awardXp(3, -10, 20), RangeError);
});

test("all five mock quests yield level 4, 5/600 XP, and one level-up event", () => {
  let game = freshGame();
  let levelUpCount = 0;
  for (const quest of game.quests) {
    const result = completeQuest(game, quest.id);
    game = result.snapshot;
    levelUpCount += result.feedback.levelsGained;
  }
  assert.equal(game.player.level, 4);
  assert.equal(game.player.xp, 5);
  assert.equal(
    game.quests.filter((quest) => quest.status === "completed").length,
    5,
  );
  assert.equal(levelUpCount, 1);
});

test("the reducer handles rapid duplicate completion actions without duplicate XP", () => {
  const loaded = gameReducer(initialGameState, {
    type: "loaded",
    snapshot: freshGame(),
  });
  const action = { type: "complete", questId: "speak-up" };
  const first = gameReducer(loaded, action);
  const second = gameReducer(first, action);
  assert.equal(second, first);
  assert.equal(second.snapshot.player.xp, 440);
  assert.equal(second.feedback.xpAwarded, 20);
});

test("an old feedback timeout cannot clear feedback for a newer quest", () => {
  let state = gameReducer(initialGameState, {
    type: "loaded",
    snapshot: freshGame(),
  });
  state = gameReducer(state, { type: "complete", questId: "train-your-ears" });
  state = gameReducer(state, { type: "complete", questId: "speak-up" });
  const unchanged = gameReducer(state, {
    type: "dismissFeedback",
    questId: "train-your-ears",
  });
  assert.equal(unchanged, state);
  assert.equal(
    gameReducer(state, { type: "dismissFeedback", questId: "speak-up" })
      .feedback,
    null,
  );
});

test("boss milestone progress never goes backward at level up and is capped", () => {
  assert.ok(bossUnlockProgress(3, 435, 4) > bossUnlockProgress(3, 420, 4));
  assert.equal(bossUnlockProgress(4, 0, 4), 1);
  assert.equal(bossUnlockProgress(5, 20, 4), 1);
  assert.equal(bossUnlockProgress(1, 0, 1), 1);
});

test("the mock service returns independent snapshots suitable for a replaceable adapter", async () => {
  const first = await mockGameService.loadGame();
  first.player.xp = 0;
  first.quests[0].status = "completed";
  const second = await mockGameService.loadGame();
  assert.equal(second.player.xp, 420);
  assert.equal(second.quests[0].status, "available");
});
