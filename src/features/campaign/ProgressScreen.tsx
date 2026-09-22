import { View } from "react-native";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { useGame } from "../game/state/GameProvider";
import { CATEGORIES } from "../game/journey/types";
import { effortMetrics } from "../game/journey/selectors";
import {
  Heading,
  JourneyGate,
  Card,
  AchievementGallery,
  DevelopmentBadge,
  campaignStyles,
} from "./components/CampaignUI";
export function ProgressScreen() {
  const { snapshot, today } = useGame();
  const journey = snapshot?.journey;
  const metrics = journey ? effortMetrics(journey) : null;
  return (
    <Screen>
      <Heading
        eyebrow="PROGRESS"
        title="Look how you showed up."
        description="Your recorded effort, across every small step. XP and minutes do not measure English proficiency."
      />
      <JourneyGate>
        {journey && metrics && (
          <>
            <DevelopmentBadge visible={journey.developmentData} />
            <View style={campaignStyles.stats}>
              {[
                [
                  "STUDY DAYS",
                  `${journey.studyDays} / ${metrics.campaignDays}`,
                ],
                ["TOTAL STUDY TIME", `${metrics.totalMinutes} min`],
                ["QUESTS COMPLETED", metrics.questsCompleted],
                ["BOSSES DEFEATED", metrics.bossesDefeated],
                ["ACHIEVEMENTS", metrics.achievements],
                [
                  "STREAK",
                  `${journey.streak} ${journey.streak === 1 ? "day" : "days"}`,
                ],
                ["TOTAL XP EARNED", journey.totalXpEarned],
              ].map(([label, value]) => (
                <View key={label} style={campaignStyles.stat}>
                  <Text variant="label" style={campaignStyles.muted}>
                    {label}
                  </Text>
                  <Text variant="title" style={campaignStyles.accent}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
            <Card>
              <Text variant="title">Practice time</Text>
              {CATEGORIES.map((category) => (
                <View key={category} style={campaignStyles.row}>
                  <Text style={campaignStyles.flex}>
                    {category.toUpperCase()} TIME
                  </Text>
                  <Text style={campaignStyles.accent}>
                    {metrics.minutesByCategory[category]} min
                  </Text>
                </View>
              ))}
              <Text variant="small" style={campaignStyles.muted}>
                Minutes come from confirmed quest durations and Boss steps.
                Lesson-only goals do not add estimated time. These records are
                self-reported.
              </Text>
            </Card>
            <Card>
              <Text variant="title">Recent effort</Text>
              {[7, 30].map((days) => (
                <View key={days} style={campaignStyles.row}>
                  <Text style={campaignStyles.flex}>LAST {days} DAYS</Text>
                  <Text style={campaignStyles.accent}>
                    {effortMetrics(journey, today, days).totalMinutes} min
                  </Text>
                </View>
              ))}
              <Text variant="small" style={campaignStyles.muted}>
                Includes today and the previous calendar days, using each
                activity&apos;s recorded local date.
              </Text>
            </Card>
            <AchievementGallery achievements={journey.achievements} />
            <Card>
              <Text variant="title">English progress</Text>
              <Text style={campaignStyles.muted}>
                Speaking, Listening, Reading, Writing, Grammar and Vocabulary
                have not been assessed. Future checkpoints will measure them
                separately.
              </Text>
            </Card>
          </>
        )}
      </JourneyGate>
    </Screen>
  );
}
