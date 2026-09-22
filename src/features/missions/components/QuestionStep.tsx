import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import { colors, fonts, radius } from "../../../theme/tokens";
import type { MissionAnswer, MissionStep } from "../../game/missions/types";

export function QuestionStep({
  step,
  answer,
  disabled,
  onAnswer,
}: {
  step: Exclude<MissionStep, { kind: "PROMPT" }>;
  answer: MissionAnswer | null;
  disabled: boolean;
  onAnswer: (value: string) => void;
}) {
  const [draft, setDraft] = useState(answer?.value ?? "");

  if (step.kind === "MANUAL_PRACTICE")
    return (
      <View style={styles.root}>
        <Text variant="title">{step.prompt}</Text>
        {step.example && (
          <Text variant="small" style={styles.muted}>
            Example: {step.example}
          </Text>
        )}
        <TextInput
          accessibilityLabel="Your practice sentence"
          editable={!answer && !disabled}
          multiline
          placeholder="Write your sentence here…"
          placeholderTextColor={colors.subtle}
          value={draft}
          onChangeText={setDraft}
          style={styles.input}
        />
        {answer ? (
          <View style={styles.feedback}>
            <Check size={18} color={colors.accent} />
            <Text style={styles.flex}>
              Practice recorded. This sentence was not automatically evaluated.
            </Text>
          </View>
        ) : (
          <Button
            label="I CREATED MY SENTENCE"
            disabled={disabled || !draft.trim()}
            onPress={() => onAnswer(draft.trim())}
          />
        )}
      </View>
    );

  return (
    <View style={styles.root}>
      <Text variant="title">{step.prompt}</Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {step.options.map((option) => {
          const selected = answer?.value === option.id;
          const correct = answer && option.id === step.correctOptionId;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                selected,
                disabled: Boolean(answer) || disabled,
              }}
              key={option.id}
              disabled={Boolean(answer) || disabled}
              onPress={() => onAnswer(option.id)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                correct && styles.correct,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.flex}>{option.label}</Text>
              {correct ? (
                <Check size={18} color={colors.accent} />
              ) : selected && answer?.correct === false ? (
                <X size={18} color={colors.amber} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {answer && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.feedback, answer.correct ? styles.good : styles.retry]}
        >
          {answer.correct ? (
            <Check size={18} color={colors.accent} />
          ) : (
            <X size={18} color={colors.amber} />
          )}
          <View style={styles.flex}>
            <Text
              variant="label"
              style={answer.correct ? styles.accent : styles.amber}
            >
              {answer.correct ? "CORRECT" : "NOT QUITE"}
            </Text>
            <Text variant="small">{step.explanation}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  options: { gap: 10 },
  option: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selected: { borderColor: colors.amber, backgroundColor: colors.amberSoft },
  correct: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pressed: { opacity: 0.8 },
  feedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.small,
    backgroundColor: colors.elevated,
  },
  good: { borderWidth: 1, borderColor: "#3A4930" },
  retry: { borderWidth: 1, borderColor: "#5A4328" },
  input: {
    minHeight: 110,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    padding: 16,
    textAlignVertical: "top",
  },
  flex: { flex: 1 },
  muted: { color: colors.muted },
  accent: { color: colors.accent },
  amber: { color: colors.amber },
});
