import { StyleSheet, View } from "react-native";
import { Sprout, Shield } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { Button } from "../../components/Button";
import { Avatar, WorldLandscape } from "../../components/Illustrations";
import { colors } from "../../theme/tokens";
import { useGame } from "../game/state/GameProvider";
import { CAMPAIGN, SILENCE, WORLDS } from "../game/journey/config";
import {
  Card,
  Heading,
  SaveError,
  campaignStyles,
} from "./components/CampaignUI";
export function StartJourneyScreen() {
  const { snapshot, startJourney, isSaving } = useGame();
  const world = WORLDS[0];
  return (
    <Screen>
      <Heading
        eyebrow="90 STUDY DAY JOURNEY"
        title="Your comeback starts here."
        description="Small steps. Real effort. A journey that moves at your pace."
      />
      <View style={styles.hero}>
        <Avatar size={100} />
        <Text variant="title">Janailson</Text>
        <Text style={campaignStyles.muted}>LV. 1 · 0 / 100 XP</Text>
        <Text variant="small" style={campaignStyles.accent}>
          STUDY DAY 0 / {CAMPAIGN.studyDays}
        </Text>
      </View>
      <Card>
        <View style={campaignStyles.row}>
          <Sprout color={colors.accent} size={20} />
          <Text variant="label" style={campaignStyles.accent}>
            WORLD 01
          </Text>
        </View>
        <Text variant="title">{world.name}</Text>
        <View style={campaignStyles.row}>
          <View style={campaignStyles.flex}>
            <Text>{world.subtitle}</Text>
            <Text variant="small" style={campaignStyles.muted}>
              Rebuilding the habit of studying English.
            </Text>
          </View>
          <WorldLandscape />
        </View>
        <Text style={campaignStyles.muted}>
          {world.end - world.start + 1} Study Days · 3 quests per day
        </Text>
        <View style={campaignStyles.row}>
          <Shield color={colors.violet} size={18} />
          <Text style={{ color: colors.violet }}>
            Final Boss · {SILENCE.name}
          </Text>
        </View>
      </Card>
      <Text style={campaignStyles.muted}>
        A Study Day advances when you finish its quests. Rest is allowed. Your
        journey never moves backward.
      </Text>
      {!snapshot?.journey && (
        <Text variant="small" style={campaignStyles.muted}>
          The previous demo stays archived. Starting here creates a separate
          journey at level 1.
        </Text>
      )}
      <SaveError />
      <Button
        label={isSaving ? "Saving your journey…" : "START MY JOURNEY"}
        disabled={isSaving}
        onPress={() => void startJourney()}
      />
      <Text variant="small" style={campaignStyles.muted}>
        XP celebrates effort. English proficiency will be assessed separately.
      </Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 10, paddingVertical: 12 },
});
