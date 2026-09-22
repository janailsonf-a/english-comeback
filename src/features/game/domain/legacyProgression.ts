// Preserved only for schema-1 demonstration data and MVP regression tests.
// XP measures engagement, never English proficiency.
export const PROGRESSION = {
  baseRequirement: 300,
  incrementPerLevel: 100,
} as const;

export function xpRequiredForLevel(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError("Level must be a positive integer.");
  }
  return (
    PROGRESSION.baseRequirement + (level - 1) * PROGRESSION.incrementPerLevel
  );
}

export function awardXp(level: number, xp: number, reward: number) {
  if (
    ![xp, reward].every((value) => Number.isSafeInteger(value) && value >= 0)
  ) {
    throw new RangeError("XP and rewards must be non-negative integers.");
  }
  let nextLevel = level;
  let nextXp = xp + reward;
  while (nextXp >= xpRequiredForLevel(nextLevel)) {
    nextXp -= xpRequiredForLevel(nextLevel);
    nextLevel += 1;
  }
  return { level: nextLevel, xp: nextXp, levelsGained: nextLevel - level };
}

// Boss progress stays cumulative when the player's current-level XP rolls over.
export function totalEngagementXp(level: number, xp: number): number {
  xpRequiredForLevel(level);
  const previousLevels = level - 1;
  return (
    previousLevels * PROGRESSION.baseRequirement +
    (PROGRESSION.incrementPerLevel * previousLevels * (previousLevels - 1)) /
      2 +
    xp
  );
}

export function bossUnlockProgress(
  level: number,
  xp: number,
  unlockLevel: number,
): number {
  const target = totalEngagementXp(unlockLevel, 0);
  return target === 0 ? 1 : Math.min(1, totalEngagementXp(level, xp) / target);
}
