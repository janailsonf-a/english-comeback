import { Check, ChevronRight, Clock3, Lock } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../../components/Text";
import { colors, fonts, radius } from "../../../theme/tokens";
import type { Quest } from "../../game/types";
import { questPresentation } from "./questPresentation";

export function QuestCard({
  quest,
  onPress,
}: {
  quest: Quest;
  onPress: () => void;
}) {
  const presentation = questPresentation[quest.category];
  const completed = quest.status === "completed";
  const locked = quest.status === "locked";
  const Icon = completed ? Check : locked ? Lock : presentation.icon;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={completed || locked}
      accessibilityState={{ disabled: completed || locked }}
      accessibilityLabel={`${quest.title}, ${quest.category}, ${quest.duration}, ${completed ? "completed, reward already claimed" : locked ? "locked" : `${quest.xpReward} XP${quest.status === "active" ? ", in progress" : ""}`}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        completed && styles.completed,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: completed
              ? colors.accentSoft
              : presentation.background,
          },
        ]}
      >
        <Icon
          size={22}
          color={completed ? colors.accent : presentation.color}
          strokeWidth={1.7}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{quest.title}</Text>
        <View style={styles.details}>
          <Text variant="small" style={{ color: presentation.color }}>
            {quest.category}
          </Text>
          <View style={styles.dot} />
          <Clock3 size={11} color={colors.subtle} />
          <Text variant="small" style={styles.muted}>
            {quest.duration}
          </Text>
        </View>
        {quest.difficulty && (
          <Text variant="small" style={styles.muted}>
            {quest.difficulty} · {quest.status.toUpperCase()}
          </Text>
        )}
        {!completed && !locked && quest.experience && (
          <Text variant="small" style={styles.missionKind}>
            {quest.experience === "interactive"
              ? "INTERACTIVE MISSION · PRACTICE HERE"
              : "EXTERNAL MISSION · PRACTICE OUTSIDE"}
          </Text>
        )}
        {quest.status === "active" && (
          <Text variant="small" style={styles.active}>
            In progress · tap to continue
          </Text>
        )}
        {completed && (
          <Text variant="small" style={styles.active}>
            Completed
          </Text>
        )}
      </View>
      <View style={styles.reward}>
        <Text
          variant="small"
          style={[styles.rewardText, completed && styles.claimed]}
        >
          {completed ? "Claimed" : `+${quest.xpReward} XP`}
        </Text>
        {!completed && !locked && (
          <ChevronRight size={16} color={colors.subtle} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card - 5,
    padding: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 90,
  },
  completed: { backgroundColor: "#121A16", borderColor: "#34422B" },
  pressed: { backgroundColor: colors.elevated, transform: [{ scale: 0.985 }] },
  icon: {
    height: 46,
    width: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
  details: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 5,
    rowGap: 0,
  },
  muted: { color: colors.muted },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.subtle,
    marginHorizontal: 2,
  },
  reward: { alignItems: "flex-end", gap: 7 },
  rewardText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 11 },
  claimed: { color: colors.muted, fontFamily: fonts.medium },
  active: { color: colors.accent, fontSize: 10, lineHeight: 15 },
  missionKind: { color: colors.blue, fontSize: 9, lineHeight: 14 },
});
