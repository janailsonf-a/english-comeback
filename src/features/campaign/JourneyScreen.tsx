import { NarrativePath } from "./components/NarrativePath";
import {
  CampaignIdentity,
  SagaHorizon,
  ProjectionCard,
} from "./components/SagaHorizon";
import { StyleSheet, View } from "react-native";
import { Check, Flag, LockKeyhole, Sprout, MapPin } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { ProgressBar } from "../../components/ProgressBar";
import { colors } from "../../theme/tokens";
import { CAMPAIGN, WORLDS } from "../game/journey/config";
import { worldStatus, currentWorld } from "../game/journey/selectors";
import { useGame } from "../game/state/GameProvider";
import { BossEncounter } from "./components/BossEncounter";
import {
  Card,
  Heading,
  JourneyGate,
  DevelopmentBadge,
  campaignStyles,
} from "./components/CampaignUI";
export function JourneyScreen() {
  const { snapshot, today } = useGame();
  const journey = snapshot?.journey;
  return (
    <Screen>
      <Heading
        eyebrow="JOURNEY"
        title="Your road to a new horizon."
        description="90 Study Days. Five worlds. Every step you complete stays on your map."
      />
      <JourneyGate>
        {journey && (
          <>
            <CampaignIdentity journey={journey} />
            <NarrativePath journey={journey} />
            <ProjectionCard journey={journey} today={today} />
            <Card>
              <Text variant="title">{currentWorld(journey).name}</Text>
              <Text variant="label" style={campaignStyles.accent}>
                STUDY DAY {journey.studyDays} / {CAMPAIGN.studyDays}
              </Text>
              <ProgressBar
                progress={journey.studyDays / CAMPAIGN.studyDays}
                label="90 Study Day campaign progress"
              />
              <Text style={campaignStyles.muted}>
                Study Days advance through completed daily quests, independently
                of the calendar.
              </Text>
              <DevelopmentBadge visible={journey.developmentData} />
            </Card>
            <View style={styles.map}>
              {WORLDS.slice()
                .reverse()
                .map((world) => {
                  const status = worldStatus(journey, world.id);
                  return (
                    <View key={world.id} style={styles.world}>
                      <View style={styles.node}>
                        {status === "LOCKED" ? (
                          <LockKeyhole size={18} color={colors.subtle} />
                        ) : status === "COMPLETED" ? (
                          <Check size={20} color={colors.accent} />
                        ) : (
                          <Sprout size={20} color={colors.accent} />
                        )}
                      </View>
                      <View style={styles.content}>
                        <Card>
                          <Text
                            variant="label"
                            style={
                              status === "LOCKED"
                                ? campaignStyles.muted
                                : campaignStyles.accent
                            }
                          >
                            WORLD {String(world.number).padStart(2, "0")} ·{" "}
                            {status}
                          </Text>
                          <Text variant="title">{world.name}</Text>
                          <Text style={campaignStyles.muted}>
                            {world.subtitle}
                          </Text>
                          <Text variant="small" style={campaignStyles.muted}>
                            Study Days {world.start}–{world.end}
                          </Text>
                          {status === "UNLOCKED" && (
                            <View style={styles.position}>
                              <MapPin size={20} color={colors.accent} />
                              <Text
                                variant="label"
                                style={campaignStyles.accent}
                              >
                                YOU ARE HERE
                              </Text>
                            </View>
                          )}
                          {!world.playable && (
                            <Text variant="label" style={campaignStyles.muted}>
                              COMING SOON
                            </Text>
                          )}
                          {world.playable && (
                            <ProgressBar
                              progress={journey.studyDays / world.end}
                              label="World 01 Study Day progress"
                            />
                          )}
                        </Card>
                        {world.playable && (
                          <>
                            <BossEncounter journey={journey} />
                            {world.milestones
                              .slice()
                              .reverse()
                              .map((day) => (
                                <View key={day} style={styles.milestone}>
                                  {journey.studyDays >= day ? (
                                    <Check size={18} color={colors.accent} />
                                  ) : (
                                    <Flag size={18} color={colors.subtle} />
                                  )}
                                  <Text
                                    style={
                                      journey.studyDays >= day
                                        ? campaignStyles.accent
                                        : campaignStyles.muted
                                    }
                                  >
                                    STUDY DAY {day} ·{" "}
                                    {journey.studyDays >= day
                                      ? "COMPLETED"
                                      : "AHEAD"}
                                  </Text>
                                </View>
                              ))}
                            {!journey.boss.defeatedAt && (
                              <View style={styles.position}>
                                <MapPin size={20} color={colors.accent} />
                                <View style={campaignStyles.flex}>
                                  <Text
                                    variant="label"
                                    style={campaignStyles.accent}
                                  >
                                    YOU ARE HERE
                                  </Text>
                                  <Text>
                                    {journey.boss.defeatedAt
                                      ? "World 02 unlocked"
                                      : journey.studyDays >= world.end
                                        ? "THE SILENCE awaits"
                                        : `Study Day ${journey.studyDays + 1} · next step`}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
            <SagaHorizon journey={journey} />
          </>
        )}
      </JourneyGate>
    </Screen>
  );
}
const styles = StyleSheet.create({
  map: { gap: 24 },
  world: { flexDirection: "row", gap: 14 },
  node: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.border,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: 18,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 16,
  },
  milestone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  position: {
    backgroundColor: colors.accentSoft,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
});
