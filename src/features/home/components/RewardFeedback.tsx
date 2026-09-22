import { Sparkles } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import { Text } from "../../../components/Text";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { colors, radius } from "../../../theme/tokens";
import { CAMPAIGN, SILENCE } from "../../game/journey/config";
import { currentChapter } from "../../game/journey/narrative/selectors";
import { TITLES } from "../../game/journey/narrative/config";
import {
  rewardSequence,
  type RewardSequenceEvent,
} from "../../game/missions/rewardSequence";
import { rewardHaptics } from "../../game/services/rewardHaptics";
import { useGame } from "../../game/state/GameProvider";
import { RewardSummary } from "./RewardSummary";

function eventHeading(event: RewardSequenceEvent) {
  const headings: Record<RewardSequenceEvent["type"], string> = {
    MISSION_COMPLETE: "MISSION COMPLETE",
    QUEST_COMPLETE: "QUEST COMPLETE",
    BOSS_STEP_COMPLETE: "BOSS STEP COMPLETE",
    BOSS_DEFEATED: "BOSS DEFEATED",
    LEVEL_UP: "LEVEL UP",
    UNLOCKS: "REWARD UNLOCKED",
    STUDY_DAY_COMPLETE: "STUDY DAY COMPLETE",
    CHAPTER_ADVANCE: "CHAPTER ADVANCE",
  };
  return headings[event.type];
}

function EventContent({ event }: { event: RewardSequenceEvent }) {
  const { feedback, snapshot } = useGame();
  if (!feedback || !snapshot) return null;
  const journey = snapshot.journey;
  if (event.type === "MISSION_COMPLETE" || event.type === "QUEST_COMPLETE")
    return (
      <>
        <RewardSummary />
        {feedback.missionId && (
          <Text variant="small" style={styles.muted}>
            {feedback.category?.toUpperCase()} · +
            {feedback.missionDurationMinutes} min recorded
          </Text>
        )}
        <Text style={styles.accent}>
          {feedback.missionType === "SPEAKING"
            ? "Your voice moved you forward."
            : "Your practice moved you forward."}
        </Text>
      </>
    );
  if (event.type === "BOSS_STEP_COMPLETE")
    return (
      <>
        <Text variant="title">THE SILENCE</Text>
        <Text style={styles.accent}>20 BOSS HP REMOVED</Text>
        <Text style={styles.muted}>
          Your voice opened the next battle step.
        </Text>
      </>
    );
  if (event.type === "BOSS_DEFEATED")
    return (
      <>
        <Text variant="hero">THE SILENCE</Text>
        <Text variant="title" style={styles.accent}>
          +{SILENCE.xpReward} XP
        </Text>
        <Text style={styles.muted}>
          World 01 complete. FIND YOUR VOICE is unlocked · COMING SOON.
        </Text>
      </>
    );
  if (event.type === "LEVEL_UP")
    return (
      <>
        <Text variant="hero" style={styles.accent}>
          LV. {feedback.level}
        </Text>
        <Text>Your effort carried into a new level.</Text>
        <Text variant="small" style={styles.muted}>
          Levels celebrate engagement. They do not assess English proficiency.
        </Text>
      </>
    );
  if (event.type === "UNLOCKS")
    return (
      <>
        {journey?.achievements
          .filter((item) => feedback.achievementIds?.includes(item.id))
          .map((item) => (
            <View key={item.id} style={styles.unlock}>
              <Text variant="label" style={styles.accent}>
                ACHIEVEMENT UNLOCKED
              </Text>
              <Text variant="title">{item.title}</Text>
              <Text style={styles.muted}>{item.description}</Text>
            </View>
          ))}
        {TITLES.filter((item) => feedback.titleIds?.includes(item.id)).map(
          (item) => (
            <View key={item.id} style={styles.unlock}>
              <Text variant="label" style={styles.accent}>
                TITLE UNLOCKED
              </Text>
              <Text variant="title">{item.title}</Text>
            </View>
          ),
        )}
      </>
    );
  if (event.type === "STUDY_DAY_COMPLETE")
    return (
      <>
        <Text variant="title" style={styles.accent}>
          +{CAMPAIGN.dailyBonus} XP BONUS
        </Text>
        <Text variant="hero">DAY {feedback.dayComplete}</Text>
        <Text>All three Daily Quests are complete.</Text>
        <Text style={styles.accent}>YOU MOVED FORWARD TODAY.</Text>
      </>
    );
  const chapter = journey ? currentChapter(journey) : null;
  return (
    <>
      <Text variant="label" style={styles.accent}>
        CURRENT CHAPTER
      </Text>
      <Text variant="hero">{chapter?.title ?? "THE AWAKENING"}</Text>
      <Text style={styles.muted}>{chapter?.subtitle}</Text>
    </>
  );
}

export function RewardFeedback() {
  const { feedback } = useGame();
  return feedback ? <RewardFeedbackContent key={feedback.questId} /> : null;
}

function RewardFeedbackContent() {
  const { feedback, dismissFeedback } = useGame();
  const reducedMotion = useReducedMotion();
  const [animation] = useState(() => new Animated.Value(0));
  const [eventIndex, setEventIndex] = useState(0);
  const lastHaptic = useRef<string | null>(null);
  const events = useMemo(
    () => (feedback ? rewardSequence(feedback) : []),
    [feedback],
  );
  const event = events[eventIndex];
  const requiresSheet = Boolean(
    feedback &&
    (feedback.missionId ||
      events.length > 1 ||
      feedback.bossDefeated ||
      feedback.dayComplete),
  );

  useEffect(() => {
    if (!feedback || !event) {
      lastHaptic.current = null;
      return;
    }
    if (lastHaptic.current !== feedback.questId) {
      lastHaptic.current = feedback.questId;
      void rewardHaptics(
        requiresSheet || Boolean(feedback.achievementIds?.length),
      );
    }
    animation.setValue(0);
    const transition = Animated.timing(animation, {
      toValue: 1,
      duration: reducedMotion ? 0 : 180,
      useNativeDriver: true,
    });
    transition.start();
    const timer = requiresSheet
      ? null
      : setTimeout(() => dismissFeedback(feedback.questId), 5000);
    return () => {
      transition.stop();
      if (timer) clearTimeout(timer);
    };
  }, [
    feedback,
    event,
    requiresSheet,
    animation,
    reducedMotion,
    dismissFeedback,
  ]);

  if (!feedback || !event) return null;
  const heading = eventHeading(event);
  const content = (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={{
        gap: 16,
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.heading}>
        <Sparkles size={24} color={colors.accent} />
        <Text variant="label" style={styles.accent}>
          {heading}
        </Text>
      </View>
      <EventContent event={event} />
    </Animated.View>
  );

  if (requiresSheet) {
    const finalEvent = eventIndex === events.length - 1;
    return (
      <Sheet
        visible
        label={heading}
        onClose={() => dismissFeedback(feedback.questId)}
      >
        {content}
        <Button
          label={finalEvent ? "CONTINUE JOURNEY" : "CONTINUE"}
          onPress={() =>
            finalEvent
              ? dismissFeedback(feedback.questId)
              : setEventIndex((index) => index + 1)
          }
        />
        {!finalEvent && (
          <Button
            secondary
            label="SKIP REWARD SEQUENCE"
            onPress={() => dismissFeedback(feedback.questId)}
          />
        )}
      </Sheet>
    );
  }

  return (
    <View pointerEvents="none" style={styles.toastPosition}>
      <View style={styles.toast}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastPosition: {
    position: "absolute",
    bottom: 100,
    left: 18,
    right: 18,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    maxWidth: 560,
    padding: 18,
    backgroundColor: "#273421",
    borderWidth: 1,
    borderColor: "#637D45",
    borderRadius: radius.card,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 10 },
  unlock: { gap: 5 },
  accent: { color: colors.accent },
  muted: { color: colors.muted },
});
