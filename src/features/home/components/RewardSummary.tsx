import { View } from "react-native";
import { Text } from "../../../components/Text";
import { ProgressBar } from "../../../components/ProgressBar";
import { xpRequiredForLevel } from "../../game/domain/progression";
import {
  chapterForDay,
  chapterProgress,
} from "../../game/journey/narrative/selectors";
import { TITLES } from "../../game/journey/narrative/config";
import { CAMPAIGN } from "../../game/journey/config";
import { useGame } from "../../game/state/GameProvider";
import { campaignStyles } from "../../campaign/components/CampaignUI";
export function RewardSummary() {
  const { feedback, snapshot } = useGame();
  if (!feedback || !snapshot) return null;
  const journey = snapshot.journey;
  const chapter = feedback.chapterDay
    ? chapterForDay(feedback.chapterDay)
    : null;
  const progress =
    journey && chapter ? chapterProgress(journey, chapter) : null;
  const remaining = (feedback.dailyTotal ?? 0) - (feedback.dailyCompleted ?? 0);
  return (
    <View style={{ gap: 12, alignSelf: "stretch" }}>
      {feedback.questTitle && (
        <>
          <Text variant="title">{feedback.questTitle}</Text>
          <Text variant="small" style={campaignStyles.muted}>
            {feedback.category?.toUpperCase()} · +
            {feedback.xpAwarded -
              (feedback.dayComplete ? CAMPAIGN.dailyBonus : 0)}{" "}
            XP
          </Text>
        </>
      )}
      <Text style={campaignStyles.accent}>
        LV. {snapshot.player.level} · {snapshot.player.xp} /{" "}
        {xpRequiredForLevel(snapshot.player.level)} XP
      </Text>
      <ProgressBar
        progress={
          snapshot.player.xp / xpRequiredForLevel(snapshot.player.level)
        }
        initialProgress={0}
        label="Reward level progress"
      />
      {feedback.dailyTotal !== undefined && (
        <>
          <Text variant="label" style={campaignStyles.accent}>
            {feedback.dailyCompleted}/{feedback.dailyTotal} DAILY QUESTS
          </Text>
          {!feedback.dayComplete && (
            <Text variant="small" style={campaignStyles.muted}>
              {remaining === 1
                ? "One quest remains."
                : `${remaining} quests remain.`}
            </Text>
          )}
        </>
      )}
      {feedback.dayComplete && (
        <>
          <Text variant="label" style={campaignStyles.accent}>
            STUDY DAY COMPLETE
          </Text>
          <Text>
            Day {feedback.dayComplete - 1} → Day {feedback.dayComplete}
          </Text>
          {progress && (
            <>
              <Text variant="small" style={campaignStyles.muted}>
                {progress.chapter.title} · {progress.completed}/{progress.total}{" "}
                Study Days
              </Text>
              <ProgressBar
                progress={progress.fraction}
                initialProgress={0}
                label="Completed day chapter progress"
                height={5}
              />
            </>
          )}
          <Text style={campaignStyles.accent}>YOU MOVED FORWARD TODAY.</Text>
        </>
      )}
      {journey?.achievements
        .filter((a) => feedback.achievementIds?.includes(a.id))
        .map((a) => (
          <View key={a.id} style={{ gap: 4 }}>
            <Text variant="label" style={campaignStyles.accent}>
              ACHIEVEMENT UNLOCKED
            </Text>
            <Text>{a.title}</Text>
          </View>
        ))}
      {TITLES.filter((t) => feedback.titleIds?.includes(t.id)).map((t) => (
        <View key={t.id} style={{ gap: 4 }}>
          <Text variant="label" style={campaignStyles.accent}>
            TITLE UNLOCKED
          </Text>
          <Text variant="title">{t.title}</Text>
        </View>
      ))}
    </View>
  );
}
