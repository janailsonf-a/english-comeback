import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { BookOpen, Plus } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import { Text } from "../../../components/Text";
import { colors, fonts, radius } from "../../../theme/tokens";
import {
  learningMetrics,
  prioritizedVocabulary,
  vocabularyIsDue,
  vocabularyIsWeak,
} from "../../game/learning/selectors";
import { useGame } from "../../game/state/GameProvider";
import { Card, campaignStyles } from "./CampaignUI";

export function VocabularyVault() {
  const { snapshot, today, learningAction, isSaving } = useGame();
  const learning = snapshot?.journey?.learning;
  const [visible, setVisible] = useState(false);
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  if (!learning) return null;
  const metrics = learningMetrics(learning, today);
  const priority = prioritizedVocabulary(learning, today).slice(0, 6);

  const save = async () => {
    const saved = await learningAction({
      type: "importVocabulary",
      term,
      meaning,
      example,
    });
    if (!saved) return;
    setTerm("");
    setMeaning("");
    setExample("");
    setVisible(false);
  };

  return (
    <>
      <Card>
        <View style={campaignStyles.row}>
          <BookOpen size={22} color={colors.accent} />
          <View style={campaignStyles.flex}>
            <Text variant="title">Vocabulary Vault</Text>
            <Text variant="small" style={campaignStyles.muted}>
              Words collected from missions and your previous study.
            </Text>
          </View>
        </View>
        <View style={styles.metrics}>
          {[
            ["WORDS", metrics.total],
            ["DUE", metrics.due],
            ["WEAK", metrics.weak],
            ["MASTERED", metrics.mastered],
          ].map(([label, value]) => (
            <View key={label} style={styles.metric}>
              <Text variant="label" style={campaignStyles.muted}>
                {label}
              </Text>
              <Text variant="title" style={campaignStyles.accent}>
                {value}
              </Text>
            </View>
          ))}
        </View>
        <View style={campaignStyles.section}>
          {priority.map((entry) => (
            <View key={entry.id} style={styles.word}>
              <View style={campaignStyles.flex}>
                <Text>{entry.term}</Text>
                <Text variant="small" style={campaignStyles.muted}>
                  {entry.meaning}
                </Text>
              </View>
              <Text
                variant="label"
                style={
                  vocabularyIsWeak(entry) || vocabularyIsDue(entry, today)
                    ? styles.attention
                    : campaignStyles.accent
                }
              >
                {vocabularyIsWeak(entry)
                  ? "WEAK"
                  : vocabularyIsDue(entry, today)
                    ? "DUE"
                    : entry.mastery}
              </Text>
            </View>
          ))}
        </View>
        <Button
          label="ADD A WORD"
          icon={Plus}
          secondary
          onPress={() => setVisible(true)}
        />
        <Text variant="small" style={campaignStyles.muted}>
          Mastery here reflects review history inside the app. It is not an
          English proficiency score.
        </Text>
      </Card>
      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        label="Add a word to Vocabulary Vault"
      >
        <Text variant="label" style={campaignStyles.accent}>
          VOCABULARY VAULT
        </Text>
        <Text variant="hero">Add a word</Text>
        <Text style={campaignStyles.muted}>
          Save vocabulary from previous study. Future missions can use this
          inventory to choose useful reviews.
        </Text>
        <TextInput
          accessibilityLabel="Word or phrase"
          autoCapitalize="none"
          maxLength={80}
          placeholder="Word or phrase"
          placeholderTextColor={colors.subtle}
          value={term}
          onChangeText={setTerm}
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Meaning"
          maxLength={240}
          multiline
          placeholder="Meaning"
          placeholderTextColor={colors.subtle}
          value={meaning}
          onChangeText={setMeaning}
          style={[styles.input, styles.multiline]}
        />
        <TextInput
          accessibilityLabel="Example sentence"
          maxLength={300}
          multiline
          placeholder="Example sentence (optional)"
          placeholderTextColor={colors.subtle}
          value={example}
          onChangeText={setExample}
          style={[styles.input, styles.multiline]}
        />
        <Button
          label="SAVE TO VAULT"
          disabled={isSaving || !term.trim() || !meaning.trim()}
          onPress={() => void save()}
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: {
    minWidth: "22%",
    flexGrow: 1,
    padding: 12,
    gap: 4,
    borderRadius: radius.small,
    backgroundColor: colors.elevated,
  },
  word: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  attention: { color: colors.amber },
  input: {
    minHeight: 54,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
});
