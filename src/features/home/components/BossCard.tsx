import { LinearGradient } from "expo-linear-gradient";
import { LockKeyhole, Shield } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { BossPortrait } from "../../../components/Illustrations";
import { ProgressBar } from "../../../components/ProgressBar";
import { Text } from "../../../components/Text";
import { colors, fonts, radius } from "../../../theme/tokens";
import { bossUnlockProgress } from "../../game/domain/progression";
import type { BossPreview, Player } from "../../game/types";

export function BossCard({
  boss,
  player,
}: {
  boss: BossPreview;
  player: Player;
}) {
  const progress = bossUnlockProgress(
    player.level,
    player.xp,
    boss.unlockLevel,
  );
  const unlocked = progress >= 1;
  return (
    <LinearGradient
      colors={["#262135", "#171720"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.inline}>
          <Shield size={13} color={colors.violet} />
          <Text variant="label" style={styles.violet}>
            {unlocked ? "BOSS MILESTONE REACHED" : "BOSS APPROACHING"}
          </Text>
        </View>
        <Text variant="small" style={styles.tag}>
          01
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.description}>
          <Text variant="title" style={styles.title}>
            {boss.name}
          </Text>
          <Text variant="small" style={styles.muted}>
            {boss.description}
          </Text>
          <Text variant="small" style={styles.difficulty}>
            {boss.difficulty}
          </Text>
        </View>
        <BossPortrait size={100} />
      </View>
      <View style={styles.unlockRow}>
        <View style={styles.inline}>
          <LockKeyhole size={12} color={colors.violet} />
          <Text variant="small" style={styles.violet}>
            {unlocked
              ? `Level ${boss.unlockLevel} reached`
              : `Unlock milestone · level ${boss.unlockLevel}`}
          </Text>
        </View>
        <Text variant="small" style={styles.violet}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={colors.violet}
        label={`${boss.name} level ${boss.unlockLevel} unlock milestone`}
        height={6}
      />
      <Text variant="small" style={styles.preview}>
        {unlocked
          ? "Your effort paid off. Boss Battles are coming in a future chapter."
          : "Keep studying. Every quest brings you closer."}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: "#443952",
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  violet: { color: colors.violet },
  tag: { color: "#8A7CA7", fontFamily: fonts.display, fontSize: 13 },
  content: { flexDirection: "row", alignItems: "center" },
  description: { flex: 1, gap: 6 },
  title: { fontSize: 23 },
  muted: { color: "#B5ACCA" },
  difficulty: { fontSize: 10, color: "#9183A5", marginTop: 2 },
  unlockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  preview: { color: "#9B8DAE", fontSize: 10, lineHeight: 17 },
});
