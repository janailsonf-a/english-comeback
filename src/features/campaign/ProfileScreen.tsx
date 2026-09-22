import { TitlesCard } from "./components/TitlesCard";
import { TimeCapsulesCard } from "./components/TimeCapsulesCard";
import { View } from "react-native";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { Avatar } from "../../components/Illustrations";
import { useGame } from "../game/state/GameProvider";
import { currentWorld } from "../game/journey/selectors";
import { CAMPAIGN } from "../game/journey/config";
import {
  Card,
  Heading,
  JourneyGate,
  AchievementGallery,
  DevelopmentBadge,
  campaignStyles,
} from "./components/CampaignUI";
import { DeveloperPanel } from "./components/DeveloperPanel";
export function ProfileScreen() {
  const { snapshot } = useGame();
  const journey = snapshot?.journey;
  return (
    <Screen>
      <Heading
        eyebrow="PROFILE"
        title="The hero is you."
        description="Your identity, your effort, your next chapter."
      />
      <JourneyGate>
        {journey && (
          <>
            <Card>
              <View style={{ alignItems: "center", gap: 12 }}>
                <Avatar size={96} />
                <Text variant="title">{snapshot?.player.name}</Text>
                <Text style={campaignStyles.accent}>
                  LV. {journey.level} · {currentWorld(journey).name}
                </Text>
                <Text style={campaignStyles.muted}>
                  Study Day {journey.studyDays} / {CAMPAIGN.studyDays}
                </Text>
              </View>
              <Text>
                Journey started ·{" "}
                {journey.startedAt
                  ? new Date(journey.startedAt).toLocaleDateString()
                  : "Not started"}
              </Text>
              <Text style={campaignStyles.accent}>
                {snapshot?.player.title}
              </Text>
              <Text>Total XP earned · {journey.totalXpEarned}</Text>
              <Text>
                Rest Tokens · {journey.restTokens} /{" "}
                {CAMPAIGN.restTokens.maximum}
              </Text>
              <Text variant="small" style={campaignStyles.muted}>
                Two tokens refresh each Monday, up to four. Closed days without
                a completed Study Day use a token to preserve an existing
                streak.
              </Text>
              <DevelopmentBadge visible={journey.developmentData} />
            </Card>
            <TitlesCard />
            <TimeCapsulesCard />
            <AchievementGallery achievements={journey.achievements} />
            <Text variant="small" style={campaignStyles.muted}>
              Local profile · your journey is stored on this device.
            </Text>
          </>
        )}
      </JourneyGate>
      {__DEV__ && <DeveloperPanel />}
    </Screen>
  );
}
