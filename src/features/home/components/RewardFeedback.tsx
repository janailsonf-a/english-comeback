import { Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import { Text } from "../../../components/Text";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { colors, radius } from "../../../theme/tokens";
import { CAMPAIGN, SILENCE } from "../../game/journey/config";
import { rewardHaptics } from "../../game/services/rewardHaptics";
import { useGame } from "../../game/state/GameProvider";
import { RewardSummary } from "./RewardSummary";

export function RewardFeedback() {
  const { feedback, dismissFeedback } = useGame();
  const reducedMotion = useReducedMotion();
  const [animation] = useState(() => new Animated.Value(0));
  const lastHaptic = useRef<string | null>(null);
  const milestone = Boolean(
    feedback &&
    (feedback.levelsGained > 0 ||
      feedback.dayComplete ||
      feedback.bossDefeated ||
      feedback.titleIds?.length),
  );
  useEffect(() => {
    if (!feedback) {
      lastHaptic.current = null;
      return;
    }
    const key = feedback.questId;
    if (lastHaptic.current !== key) {
      lastHaptic.current = key;
      void rewardHaptics(milestone || Boolean(feedback.achievementIds?.length));
    }
    animation.setValue(0);
    const transition = Animated.timing(animation, {
      toValue: 1,
      duration: reducedMotion ? 0 : 220,
      useNativeDriver: true,
    });
    transition.start();
    const timer = milestone
      ? null
      : setTimeout(() => dismissFeedback(feedback.questId), 5000);
    return () => {
      transition.stop();
      if (timer) clearTimeout(timer);
    };
  }, [feedback, milestone, animation, reducedMotion, dismissFeedback]);
  if (!feedback) return null;
  const heading = feedback.bossDefeated
    ? "BOSS DEFEATED"
    : feedback.dayComplete
      ? "DAILY QUESTS COMPLETE"
      : feedback.levelsGained > 0
        ? "LEVEL UP"
        : feedback.titleIds?.length
          ? "TITLE UNLOCKED"
          : feedback.questId.startsWith("boss:")
            ? "BOSS STEP COMPLETE"
            : "QUEST COMPLETE";
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
              outputRange: [10, 0],
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
      {feedback.dayComplete && (
        <Text variant="title" style={styles.accent}>
          +{CAMPAIGN.dailyBonus} XP BONUS
        </Text>
      )}
      {feedback.bossDefeated && (
        <>
          <Text variant="hero">THE SILENCE</Text>
          <Text variant="title" style={styles.accent}>
            +{SILENCE.xpReward} XP
          </Text>
          <Text style={styles.muted}>
            World 01 complete. FIND YOUR VOICE is unlocked · COMING SOON.
          </Text>
        </>
      )}
      {feedback.levelsGained > 0 && (
        <Text variant="title" style={styles.accent}>
          LEVEL UP · LV. {feedback.level}
        </Text>
      )}
      <RewardSummary />
    </Animated.View>
  );
  if (milestone)
    return (
      <Sheet
        visible
        label={
          feedback.bossDefeated
            ? "BOSS DEFEATED"
            : feedback.dayComplete
              ? "DAY COMPLETE"
              : heading
        }
        onClose={() => dismissFeedback(feedback.questId)}
      >
        {content}
        <Text variant="small" style={styles.muted}>
          Levels celebrate effort. They do not assess English proficiency.
        </Text>
        <Button
          label="Continue my comeback"
          onPress={() => dismissFeedback(feedback.questId)}
        />
      </Sheet>
    );
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
  accent: { color: colors.accent },
  muted: { color: colors.muted },
});
