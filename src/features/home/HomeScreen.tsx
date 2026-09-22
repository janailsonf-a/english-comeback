import { PrologueScreen } from "../campaign/PrologueScreen";
import { NarrativePath } from "../campaign/components/NarrativePath";
import { needsPrologue } from "../game/journey/narrative/rules";
import { Sparkles } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { colors, fonts, radius } from "../../theme/tokens";
import { useGame } from "../game/state/GameProvider";
import { CAMPAIGN, SILENCE } from "../game/journey/config";
import { PlayerCard } from "./components/PlayerCard";
import { QuestCard } from "./components/QuestCard";
import { QuestDetails } from "./components/QuestDetails";
import { StartJourneyScreen } from "../campaign/StartJourneyScreen";
import { BossEncounter } from "../campaign/components/BossEncounter";
import {
  Card,
  SaveError,
  DevelopmentBadge,
  campaignStyles,
} from "../campaign/components/CampaignUI";
import { useQuestInteraction } from "../campaign/hooks/useQuestInteraction";

export function HomeScreen() {
  const { snapshot, error, isSaving, saveError } = useGame();
  const interaction = useQuestInteraction();
  if (!snapshot)
    return (
      <Screen>
        <View style={styles.loading}>
          {error ? (
            <Text accessibilityRole="alert">{error}</Text>
          ) : (
            <>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.muted}>Preparing your comeback…</Text>
            </>
          )}
        </View>
      </Screen>
    );
  if (!snapshot.journey?.startedAt) return <StartJourneyScreen />;
  const journey = snapshot.journey;
  if (needsPrologue(journey)) return <PrologueScreen />;
  const daily = snapshot.quests.filter((q) => !q.optional);
  const special = snapshot.quests.filter((q) => q.optional);
  const completed = daily.filter((q) => q.status === "completed").length;
  return (
    <View style={styles.root}>
      <Screen>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Sparkles size={19} color={colors.accent} strokeWidth={1.6} />
            </View>
            <View>
              <Text variant="label" style={styles.brandTop}>
                ENGLISH
              </Text>
              <Text style={styles.brandName}>COMEBACK</Text>
            </View>
          </View>
          <View style={styles.day}>
            <View style={styles.dayDot} />
            <Text variant="small" style={styles.dayText}>
              STUDY DAY {journey.studyDays} / {CAMPAIGN.studyDays}
            </Text>
          </View>
        </View>
        <View style={styles.welcome}>
          <Text variant="label" style={styles.muted}>
            WELCOME BACK, {snapshot.player.name.toUpperCase()}
          </Text>
          <Text variant="hero">
            Your next chapter{"\n"}starts today
            <Text variant="hero" style={styles.accent}>
              .
            </Text>
          </Text>
          <Text style={styles.muted}>
            A little English. A little stronger. Every day.
          </Text>
        </View>
        <PlayerCard player={snapshot.player} world={snapshot.world} />
        <View style={campaignStyles.row}>
          <Text variant="small" style={campaignStyles.accent}>
            REST TOKENS · {journey.restTokens} / {CAMPAIGN.restTokens.maximum}
          </Text>
          <Text variant="small" style={campaignStyles.muted}>
            Rest protects your streak.
          </Text>
        </View>
        <NarrativePath journey={journey} compact />
        <DevelopmentBadge visible={journey.developmentData} />
        <SaveError />
        {journey.comeback !== "NORMAL" && (
          <Card>
            <Text variant="label" style={styles.accent}>
              WELCOME BACK
            </Text>
            <Text>Your progress is still here.</Text>
            <Text style={styles.muted}>
              Your goal is still there. Continue when you&apos;re ready.
            </Text>
          </Card>
        )}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View>
              <Text variant="title">Daily quests</Text>
              <Text variant="small" style={styles.muted}>
                {daily.length
                  ? `Study Day ${journey.studyDays + 1} · small missions, real momentum.`
                  : "World 01's daily journey is complete."}
              </Text>
            </View>
            {daily.length > 0 && (
              <View style={styles.counter}>
                <Text variant="small" style={styles.accent}>
                  {completed} / {daily.length}
                </Text>
              </View>
            )}
          </View>
          {daily.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onPress={() => void interaction.openQuest(q.id)}
            />
          ))}
          {daily.length > 0 && (
            <Text variant="small" style={styles.muted}>
              Complete all three · +{CAMPAIGN.dailyBonus} XP daily bonus
            </Text>
          )}
          {!daily.length && (
            <Card>
              <Text variant="title">
                {journey.boss.defeatedAt
                  ? "FIND YOUR VOICE · UNLOCKED"
                  : "Your next challenge awaits."}
              </Text>
              <Text style={styles.muted}>
                {journey.boss.defeatedAt
                  ? "World 02 is coming soon. Your progress is saved."
                  : `You completed ${SILENCE.unlockStudyDays} Study Days. Take on THE SILENCE when you're ready.`}
              </Text>
            </Card>
          )}
        </View>
        {special.length > 0 && (
          <View style={styles.section}>
            <Text variant="title">A small return</Text>
            {special.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                onPress={() => void interaction.openQuest(q.id)}
              />
            ))}
          </View>
        )}
        <BossEncounter journey={journey} />
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text variant="small" style={styles.footerText}>
            XP celebrates effort. Your English grows with practice.
          </Text>
          <Text variant="label" style={styles.footerBrand}>
            BUILD YOUR COMEBACK
          </Text>
        </View>
      </Screen>
      <QuestDetails
        quest={interaction.selectedQuest}
        onClose={interaction.closeQuest}
        onComplete={interaction.finishQuest}
        saving={isSaving}
        saveError={saveError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: { marginTop: 80, alignItems: "center", gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#38432D",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTop: {
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 2.5,
    color: colors.muted,
  },
  brandName: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  day: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dayDot: {
    width: 5,
    height: 5,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  dayText: { fontSize: 10, letterSpacing: 1.2, fontFamily: fonts.bold },
  welcome: { gap: 9 },
  muted: { color: colors.muted },
  accent: { color: colors.accent },
  section: { gap: 10 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  counter: {
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.accentSoft,
  },
  dailyDone: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8 },
  sideQuestToggle: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 16,
  },
  sideQuestLabel: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flex: 1,
  },
  sideQuestTitle: { fontFamily: fonts.semibold, fontSize: 13 },
  footer: { alignItems: "center", gap: 12, paddingBottom: 6 },
  footerLine: {
    width: 28,
    height: 2,
    backgroundColor: "#394332",
    borderRadius: 2,
  },
  footerText: { fontSize: 10, color: colors.subtle, textAlign: "center" },
  footerBrand: { fontSize: 8, color: "#606C5A", letterSpacing: 2.5 },
});
