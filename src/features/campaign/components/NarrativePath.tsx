import { View } from "react-native";
import { Sprout, Trophy } from "lucide-react-native";
import { Text } from "../../../components/Text";
import { ProgressBar } from "../../../components/ProgressBar";
import { colors } from "../../../theme/tokens";
import { CAMPAIGN } from "../../game/journey/config";
import { SAGA } from "../../game/journey/narrative/config";
import { chapterProgress } from "../../game/journey/narrative/selectors";
import type { JourneyState } from "../../game/journey/types";
import { Card, campaignStyles } from "./CampaignUI";

export function NarrativePath({
  journey,
  compact = false,
}: {
  journey: JourneyState;
  compact?: boolean;
}) {
  const progress = chapterProgress(journey);
  return (
    <Card>
      <Text variant="label" style={campaignStyles.accent}>
        YOUR PATH
      </Text>
      <View style={campaignStyles.row}>
        <Sprout color={colors.accent} size={22} />
        <View style={campaignStyles.flex}>
          <Text variant="small" style={campaignStyles.muted}>
            YOU ARE HERE · {journey.studyDays} STUDY DAYS
          </Text>
          <ProgressBar
            progress={journey.studyDays / CAMPAIGN.studyDays}
            label="Your campaign path"
            height={5}
          />
        </View>
        <Trophy color={colors.subtle} size={22} />
      </View>
      <Text variant="small" style={campaignStyles.muted}>
        {SAGA.horizon} · A horizon to work toward
      </Text>
      {progress && (
        <>
          <Text variant="label" style={campaignStyles.muted}>
            CURRENT CHAPTER · {progress.chapter.numeral}
          </Text>
          <Text variant="title">{progress.chapter.title}</Text>
          {!compact && (
            <>
              <Text variant="small" style={campaignStyles.muted}>
                {progress.chapter.subtitle}
              </Text>
              <ProgressBar
                progress={progress.fraction}
                label="Current chapter progress"
                height={5}
              />
              <Text variant="small" style={campaignStyles.muted}>
                {progress.completed} / {progress.total} Study Days
              </Text>
            </>
          )}
        </>
      )}
      <Text style={campaignStyles.accent}>
        {journey.comeback === "NORMAL"
          ? "Move one step forward today."
          : "Your goal is still there. Continue when you're ready."}
      </Text>
    </Card>
  );
}
