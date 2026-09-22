import { LinearGradient } from "expo-linear-gradient";
import { Flame, Sprout, TrendingUp } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Avatar, WorldLandscape } from "../../../components/Illustrations";
import { ProgressBar } from "../../../components/ProgressBar";
import { Text } from "../../../components/Text";
import { colors, fonts, radius } from "../../../theme/tokens";
import { xpRequiredForLevel } from "../../game/domain/progression";
import type { Player, WorldPreview } from "../../game/types";

export function PlayerCard({
  player,
  world,
}: {
  player: Player;
  world: WorldPreview;
}) {
  const requirement = xpRequiredForLevel(player.level);
  return (
    <LinearGradient
      colors={["#222E24", "#17211B", "#141C19"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.profileRow}>
        <Avatar />
        <View style={styles.profileText}>
          <Text variant="title">{player.name}</Text>
          <Text variant="small" style={styles.muted}>
            {player.title}
          </Text>
        </View>
        <View style={styles.levelBadge}>
          <Text variant="label" style={styles.levelLabel}>
            LV.
          </Text>
          <Text style={styles.levelNumber}>{player.level}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.worldRow}>
        <View style={styles.worldText}>
          <View style={styles.inline}>
            <Sprout size={13} color={colors.accent} />
            <Text variant="label" style={styles.accent}>
              WORLD {String(world.number).padStart(2, "0")}
            </Text>
          </View>
          <Text variant="title" style={styles.worldTitle}>
            {world.name}
          </Text>
          <Text variant="small" style={styles.muted}>
            {world.tagline}
          </Text>
        </View>
        <WorldLandscape />
      </View>
      <View style={styles.xpHeading}>
        <View style={styles.inline}>
          <TrendingUp size={13} color={colors.accent} />
          <Text variant="small" style={styles.xpLabel}>
            EXPERIENCE
          </Text>
        </View>
        <Text variant="small" style={styles.xpNumber}>
          {player.xp}
          <Text variant="small" style={styles.muted}>
            {" "}
            / {requirement} XP
          </Text>
        </Text>
      </View>
      <ProgressBar
        progress={player.xp / requirement}
        label={`${player.xp} of ${requirement} engagement XP`}
        height={10}
      />
      <View style={styles.xpFooter}>
        <Text variant="small" style={styles.muted}>
          {requirement - player.xp} XP to level {player.level + 1}
        </Text>
        <View style={styles.inline}>
          <Flame size={15} color={colors.amber} />
          <Text variant="small" style={styles.streak}>
            {player.streak} day streak
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#3C4A35",
    gap: 12,
    overflow: "hidden",
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileText: { flex: 1 },
  muted: { color: "#A9B5A5" },
  accent: { color: colors.accent },
  levelBadge: {
    minWidth: 44,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: "center",
  },
  levelLabel: {
    color: "#344026",
    letterSpacing: 1,
    fontSize: 9,
    lineHeight: 12,
  },
  levelNumber: {
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 28,
    color: colors.background,
  },
  divider: { height: 1, backgroundColor: "#3A4634", marginVertical: 3 },
  worldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 8,
  },
  worldText: { flex: 1 },
  worldTitle: { fontSize: 19, marginTop: 4, marginBottom: 2 },
  inline: { flexDirection: "row", alignItems: "center", gap: 5 },
  xpHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 5,
  },
  xpLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: fonts.bold,
    color: "#C5D4BC",
  },
  xpNumber: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
  xpFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 5,
  },
  streak: { color: colors.amber, fontFamily: fonts.semibold },
});
