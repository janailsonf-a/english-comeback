import { Check, Clock3, Sparkles } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import { Text } from "../../../components/Text";
import { colors, radius } from "../../../theme/tokens";
import type { Quest } from "../../game/types";
import { questPresentation } from "./questPresentation";

export function QuestDetails({
  quest,
  onClose,
  onComplete,
  saving = false,
  saveError = null,
}: {
  quest: Quest | null;
  onClose: () => void;
  onComplete: (id: string) => void;
  saving?: boolean;
  saveError?: string | null;
}) {
  if (!quest) return null;
  const presentation = questPresentation[quest.category];
  const Icon = presentation.icon;
  return (
    <Sheet visible onClose={onClose} label={quest.title}>
      <View style={[styles.icon, { backgroundColor: presentation.background }]}>
        <Icon size={28} color={presentation.color} />
      </View>
      <View style={styles.heading}>
        <Text variant="label" style={{ color: presentation.color }}>
          {quest.optional ? "RETURN QUEST" : "DAILY QUEST"} ·{" "}
          {quest.category.toUpperCase()}
        </Text>
        <Text variant="hero">{quest.title}</Text>
        <Text style={styles.muted}>{quest.description}</Text>
      </View>
      {quest.difficulty && (
        <Text variant="small" style={styles.muted}>
          {quest.difficulty} ·{" "}
          {quest.studyDay ? `Study Day ${quest.studyDay}` : "Special Quest"}
        </Text>
      )}
      <View style={styles.meta}>
        <Clock3 size={16} color={colors.muted} />
        <Text>{quest.duration}</Text>
        <View style={styles.spacer} />
        <Sparkles size={16} color={colors.accent} />
        <Text style={styles.accent}>+{quest.xpReward} XP</Text>
      </View>
      <View style={styles.objective}>
        <Text variant="label" style={styles.muted}>
          YOUR MISSION
        </Text>
        <Text>{quest.objective}</Text>
      </View>
      <Text variant="small" style={styles.muted}>
        Study with your own material, then confirm below. XP rewards your
        effort; this quest does not assess your English proficiency.
      </Text>
      {saveError && (
        <Text
          accessibilityRole="alert"
          variant="small"
          style={{ color: colors.amber }}
        >
          {saveError}
        </Text>
      )}
      <Button
        label={saving ? "Saving progress…" : "I studied · complete quest"}
        icon={Check}
        disabled={
          saving || quest.status === "completed" || quest.status === "locked"
        }
        onPress={() => onComplete(quest.id)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { gap: 8 },
  muted: { color: colors.muted },
  accent: { color: colors.accent },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  spacer: { flex: 1 },
  objective: {
    backgroundColor: colors.elevated,
    borderRadius: radius.small,
    padding: 18,
    gap: 8,
  },
});
