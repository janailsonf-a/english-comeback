const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mockGameService } = require("../.game-check/services/gameService");
const { createGameSession } = require("../.game-check/domain/gameSession");
const { completeQuest } = require("../.game-check/domain/game");
const {
  createProgressStorage,
  PROGRESS_STORAGE_KEY,
} = require("../.game-check/persistence/progressStorage");

function memoryStorage(initial = null) {
  let raw = initial;
  const writes = [];
  return {
    writes,
    get raw() {
      return raw;
    },
    async getItem(key) {
      assert.equal(key, PROGRESS_STORAGE_KEY);
      return raw;
    },
    async setItem(key, value) {
      assert.equal(key, PROGRESS_STORAGE_KEY);
      raw = value;
      writes.push(value);
    },
  };
}

test("a first launch uses defaults and does not overwrite storage during hydration", async () => {
  const initial = await mockGameService.loadGame();
  const memory = memoryStorage();
  assert.equal(await createProgressStorage(memory).load(initial), initial);
  assert.equal(memory.writes.length, 0);
});

test("a new storage instance restores level, excess XP and all quest statuses", async () => {
  const memory = memoryStorage();
  const persistence = createProgressStorage(memory);
  const initial = await mockGameService.loadGame();
  const session = createGameSession(initial, persistence);
  for (const quest of initial.quests) await session.completeQuest(quest.id);
  const reopened = await createProgressStorage(memory).load(
    await mockGameService.loadGame(),
  );
  assert.equal(reopened.player.level, 4);
  assert.equal(reopened.player.xp, 5);
  assert.ok(reopened.quests.every((quest) => quest.status === "completed"));
});

test("active, available and locked quest states survive a restart", async () => {
  const memory = memoryStorage();
  const persistence = createProgressStorage(memory);
  const initial = await mockGameService.loadGame();
  initial.quests[0].status = "active";
  initial.quests[1].status = "locked";
  await persistence.save(initial);
  const restored = await persistence.load(await mockGameService.loadGame());
  assert.deepEqual(
    restored.quests.map(({ status }) => status),
    initial.quests.map(({ status }) => status),
  );
});

test("restoration keeps current quest content and rewards from the data adapter", async () => {
  const memory = memoryStorage();
  const persistence = createProgressStorage(memory);
  const done = completeQuest(
    await mockGameService.loadGame(),
    "train-your-ears",
  ).snapshot;
  await persistence.save(done);
  const updatedContent = await mockGameService.loadGame();
  updatedContent.quests[0].title = "Updated listening quest";
  updatedContent.quests[0].xpReward = 25;
  const restored = await persistence.load(updatedContent);
  assert.equal(restored.quests[0].title, "Updated listening quest");
  assert.equal(restored.quests[0].xpReward, 25);
  assert.equal(restored.quests[0].status, "completed");
  assert.equal(completeQuest(restored, "train-your-ears").feedback, null);
});

test("malformed, unsupported or invalid saves are rejected without replacing them", async () => {
  const initial = await mockGameService.loadGame();
  const valid = memoryStorage();
  await createProgressStorage(valid).save(initial);
  const data = JSON.parse(valid.raw);
  const invalid = [
    "{",
    "null",
    "[]",
    JSON.stringify({ ...data, schemaVersion: 2 }),
    JSON.stringify({ ...data, playerId: "another-player" }),
    JSON.stringify({ ...data, level: 0 }),
    JSON.stringify({ ...data, level: 3.5 }),
    JSON.stringify({ ...data, xp: -1 }),
    JSON.stringify({ ...data, xp: 500 }),
    JSON.stringify({
      ...data,
      quests: [{ id: "train-your-ears", status: "unknown" }],
    }),
    JSON.stringify({ ...data, quests: [data.quests[0], data.quests[0]] }),
  ];
  for (const raw of invalid) {
    const memory = memoryStorage(raw);
    await assert.rejects(() => createProgressStorage(memory).load(initial));
    assert.equal(memory.raw, raw);
    assert.equal(memory.writes.length, 0);
  }
});

test("storage read errors propagate instead of silently resetting a journey", async () => {
  let wrote = false;
  const persistence = createProgressStorage({
    async getItem() {
      throw new Error("Read failed");
    },
    async setItem() {
      wrote = true;
    },
  });
  const initial = await mockGameService.loadGame();
  await assert.rejects(() => persistence.load(initial), /Read failed/);
  assert.equal(wrote, false);
});

test("XP and completed status are written together under one key", async () => {
  const memory = memoryStorage();
  const session = createGameSession(
    await mockGameService.loadGame(),
    createProgressStorage(memory),
  );
  const result = await session.completeQuest("speak-up");
  assert.equal(memory.writes.length, 1);
  const saved = JSON.parse(memory.raw);
  assert.equal(saved.xp, 440);
  assert.equal(
    saved.quests.find(({ id }) => id === "speak-up").status,
    "completed",
  );
  assert.equal(result.feedback.xpAwarded, 20);
  assert.equal(saved.feedback, undefined);
});

test("simultaneous duplicate completions award and persist XP exactly once", async () => {
  const memory = memoryStorage();
  const session = createGameSession(
    await mockGameService.loadGame(),
    createProgressStorage(memory),
  );
  const results = await Promise.all([
    session.completeQuest("speak-up"),
    session.completeQuest("speak-up"),
  ]);
  assert.equal(results[0].feedback.xpAwarded, 20);
  assert.equal(results[1].feedback, null);
  assert.equal(results[1].snapshot.player.xp, 440);
  assert.equal(memory.writes.length, 1);
});

test("the reward is not published until persistence finishes", async () => {
  let release;
  let began;
  let published = false;
  const started = new Promise((resolve) => {
    began = resolve;
  });
  const session = createGameSession(await mockGameService.loadGame(), {
    async load(initial) {
      return initial;
    },
    async save() {
      await new Promise((resolve) => {
        release = resolve;
        began();
      });
    },
  });
  const pending = session.completeQuest("speak-up").then((result) => {
    published = true;
    return result;
  });
  await started;
  assert.equal(published, false);
  release();
  assert.equal((await pending).snapshot.player.xp, 440);
});

test("a failed write rolls back progress and a retry grants only one reward", async () => {
  const memory = memoryStorage();
  let fail = true;
  const persistence = createProgressStorage({
    getItem: memory.getItem,
    async setItem(key, value) {
      if (fail) {
        fail = false;
        throw new Error("Disk full");
      }
      await memory.setItem(key, value);
    },
  });
  const session = createGameSession(
    await mockGameService.loadGame(),
    persistence,
  );
  await assert.rejects(() => session.completeQuest("speak-up"), /Disk full/);
  assert.equal(memory.raw, null);
  const retry = await session.completeQuest("speak-up");
  assert.equal(retry.snapshot.player.xp, 440);
  assert.equal(memory.writes.length, 1);
  assert.equal((await session.completeQuest("speak-up")).feedback, null);
});

test("concurrent distinct quests are serialized and all XP is retained", async () => {
  const initial = await mockGameService.loadGame();
  const memory = memoryStorage();
  const session = createGameSession(initial, createProgressStorage(memory));
  await Promise.all(initial.quests.map(({ id }) => session.completeQuest(id)));
  const restored = await createProgressStorage(memory).load(
    await mockGameService.loadGame(),
  );
  assert.equal(restored.player.level, 4);
  assert.equal(restored.player.xp, 5);
  assert.equal(memory.writes.length, 5);
});

test("a completed quest cannot grant XP again after reopening the app", async () => {
  const memory = memoryStorage();
  const persistence = createProgressStorage(memory);
  await createGameSession(
    await mockGameService.loadGame(),
    persistence,
  ).completeQuest("train-your-ears");
  const restored = await persistence.load(await mockGameService.loadGame());
  const reopened = createGameSession(restored, persistence);
  const duplicate = await reopened.completeQuest("train-your-ears");
  assert.equal(duplicate.snapshot.player.xp, 435);
  assert.equal(duplicate.feedback, null);
  assert.equal(memory.writes.length, 1);
});
