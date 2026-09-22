import { View } from "react-native";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { useGame } from "../game/state/GameProvider";
import { QuestCard } from "../home/components/QuestCard";
import { QuestDetails } from "../home/components/QuestDetails";
import { useQuestInteraction } from "./hooks/useQuestInteraction";
import {
  Card,
  Heading,
  JourneyGate,
  SaveError,
  campaignStyles,
} from "./components/CampaignUI";
export function QuestsScreen() {
  const { snapshot, isSaving, saveError } = useGame();
  const interaction = useQuestInteraction();
  const current = snapshot?.quests ?? [];
  const completed =
    snapshot?.journey?.quests
      .filter((q) => q.status === "completed")
      .slice()
      .reverse() ?? [];
  return (
    <>
      <Screen>
        <Heading
          eyebrow="QUESTS"
          title="One small mission at a time."
          description="Practice first. Confirm your effort. Your progress stays with you."
        />
        <JourneyGate>
          <SaveError />
          <View style={campaignStyles.section}>
            <Text variant="title">Daily quests</Text>
            <Text variant="small" style={campaignStyles.muted}>
              Study Day{" "}
              {current.some((q) => !q.optional)
                ? (snapshot?.journey?.studyDays ?? 0) + 1
                : (snapshot?.journey?.studyDays ?? 0)}{" "}
              · complete all three for the daily bonus
            </Text>
            {current
              .filter((q) => !q.optional)
              .map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  onPress={() => void interaction.openQuest(q.id)}
                />
              ))}
            {!current.some((q) => !q.optional) && (
              <Card>
                <Text>World 01&apos;s Daily Quests are complete.</Text>
                <Text style={campaignStyles.muted}>
                  {snapshot?.journey?.boss.defeatedAt
                    ? "World 02 is unlocked · COMING SOON"
                    : "THE SILENCE awaits on Home and Journey."}
                </Text>
              </Card>
            )}
          </View>
          <View style={campaignStyles.section}>
            <Text variant="title">Special quests</Text>
            {current
              .filter((q) => q.optional)
              .map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  onPress={() => void interaction.openQuest(q.id)}
                />
              ))}
            {!current.some((q) => q.optional) && (
              <Text style={campaignStyles.muted}>
                A small return quest will be here when you need it.
              </Text>
            )}
          </View>
          <View style={campaignStyles.section}>
            <Text variant="title">Completed · {completed.length}</Text>
            {!completed.length && (
              <Text style={campaignStyles.muted}>
                Your first completed mission will appear here.
              </Text>
            )}
            {completed.map((q) => (
              <View key={q.id} style={campaignStyles.section}>
                <QuestCard
                  quest={{ ...q, optional: q.kind !== "daily" }}
                  onPress={() => {}}
                />
                <Text variant="small" style={campaignStyles.muted}>
                  {q.kind === "daily"
                    ? `Study Day ${q.studyDay}`
                    : "Return Quest"}{" "}
                  ·{" "}
                  {q.completedAt
                    ? new Date(q.completedAt).toLocaleDateString()
                    : ""}
                </Text>
              </View>
            ))}
          </View>
        </JourneyGate>
      </Screen>
      <QuestDetails
        quest={interaction.selectedQuest}
        onClose={interaction.closeQuest}
        onComplete={interaction.finishQuest}
        saving={isSaving}
        saveError={saveError}
      />
    </>
  );
}
