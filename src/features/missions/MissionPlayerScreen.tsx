import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  BookOpen,
  Clock3,
  Headphones,
  Mic,
  Play,
  Sparkles,
} from "lucide-react-native";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { colors, fonts, radius } from "../../theme/tokens";
import {
  Card,
  SaveError,
  campaignStyles,
} from "../campaign/components/CampaignUI";
import { xpRequiredForLevel } from "../game/domain/progression";
import {
  chapterForDay,
  chapterProgress,
} from "../game/journey/narrative/selectors";
import { missionDefinition } from "../game/missions/content";
import {
  answeredStep,
  missionCanAdvance,
  missionCompletion,
} from "../game/missions/selectors";
import type {
  MissionDefinition,
  MissionRecording,
  MissionRun,
} from "../game/missions/types";
import { answerHaptics } from "../game/services/missionHaptics";
import { useGame } from "../game/state/GameProvider";
import { MissionAudio } from "./components/MissionAudio";
import { MissionHeader } from "./components/MissionHeader";
import { MissionRecordingPlayback } from "./components/MissionRecordingPlayback";
import { QuestionStep } from "./components/QuestionStep";
import { SpeakingRecorder } from "./components/SpeakingRecorder";
import { useMissionTimer } from "./hooks/useMissionTimer";

function secondsLabel(value: number) {
  const safe = Math.max(0, Math.floor(value));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function MissionIntro({
  definition,
  saving,
  onStart,
  onLeave,
}: {
  definition: MissionDefinition;
  saving: boolean;
  onStart: () => void;
  onLeave: () => void;
}) {
  const Icon =
    definition.type === "SPEAKING"
      ? Mic
      : definition.type === "LISTENING"
        ? Headphones
        : BookOpen;
  return (
    <Screen>
      <MissionHeader
        title={definition.title}
        current={0}
        total={definition.steps.length}
        onLeave={onLeave}
      />
      <View style={styles.introIcon}>
        <Icon size={34} color={colors.accent} strokeWidth={1.6} />
      </View>
      <View style={styles.centered}>
        <Text variant="label" style={styles.accent}>
          MISSION
        </Text>
        <Text variant="hero" style={styles.centerText}>
          {definition.title.toUpperCase()}
        </Text>
        <Text variant="title" style={[styles.muted, styles.centerText]}>
          “{definition.subtitle}”
        </Text>
      </View>
      <Card>
        <Text variant="label" style={styles.muted}>
          OBJECTIVE
        </Text>
        <Text>{definition.objective}</Text>
        <View style={campaignStyles.row}>
          <Clock3 size={16} color={colors.muted} />
          <Text style={campaignStyles.flex}>
            {definition.estimatedMinutes} min
          </Text>
          <Sparkles size={16} color={colors.accent} />
          <Text style={styles.accent}>+{definition.xpReward} XP</Text>
        </View>
      </Card>
      <Text style={styles.muted}>{definition.narrative}</Text>
      <Button
        icon={Play}
        label={
          saving
            ? "PREPARING MISSION…"
            : definition.type === "SPEAKING"
              ? "START SPEAKING"
              : "START MISSION"
        }
        disabled={saving}
        onPress={onStart}
      />
      <Text variant="small" style={styles.muted}>
        XP rewards completed practice. This mission does not assess your English
        proficiency.
      </Text>
      <SaveError />
    </Screen>
  );
}

function MissionResult({
  definition,
  questId,
}: {
  definition: MissionDefinition;
  questId: string;
}) {
  const router = useRouter();
  const { snapshot } = useGame();
  const journey = snapshot?.journey;
  const attempt = journey?.missions?.attempts.find(
    (item) => item.questId === questId,
  );
  const chapter = attempt ? chapterForDay(attempt.studyDay) : null;
  const progress =
    journey && chapter ? chapterProgress(journey, chapter) : null;
  const completed =
    journey && attempt
      ? journey.quests.filter(
          (item) =>
            item.kind === "daily" &&
            item.studyDay === attempt.studyDay &&
            item.status === "completed",
        ).length
      : 0;
  return (
    <Screen>
      <View style={styles.resultMark}>
        <Sparkles size={36} color={colors.accent} />
      </View>
      <View accessibilityLiveRegion="polite" style={styles.centered}>
        <Text variant="label" style={styles.accent}>
          MISSION COMPLETE
        </Text>
        <Text variant="hero" style={styles.centerText}>
          {definition.title.toUpperCase()}
        </Text>
        <Text variant="title" style={styles.accent}>
          +{definition.xpReward} XP
        </Text>
      </View>
      <Card>
        <View style={campaignStyles.row}>
          <Text style={campaignStyles.flex}>WHAT YOU PRACTICED</Text>
          <Text style={styles.accent}>{definition.category.toUpperCase()}</Text>
        </View>
        <View style={campaignStyles.row}>
          <Text style={campaignStyles.flex}>TIME RECORDED</Text>
          <Text style={styles.accent}>
            +
            {attempt
              ? Math.max(1, Math.ceil(attempt.durationSeconds / 60))
              : definition.estimatedMinutes}{" "}
            min
          </Text>
        </View>
        <View style={campaignStyles.row}>
          <Text style={campaignStyles.flex}>DAILY QUESTS</Text>
          <Text style={styles.accent}>{completed} / 3</Text>
        </View>
      </Card>
      {journey && (
        <Card>
          <Text variant="label" style={styles.muted}>
            LEVEL PROGRESS
          </Text>
          <Text>
            LV. {journey.level} · {journey.xp} /{" "}
            {xpRequiredForLevel(journey.level)} XP
          </Text>
          <ProgressBar
            progress={journey.xp / xpRequiredForLevel(journey.level)}
            label="Current level progress"
          />
          {progress && (
            <>
              <Text variant="label" style={styles.muted}>
                CHAPTER PROGRESS
              </Text>
              <Text>
                {progress.chapter.title} · {progress.completed}/{progress.total}
              </Text>
              <ProgressBar
                progress={progress.fraction}
                label="Current chapter progress"
                height={5}
              />
            </>
          )}
        </Card>
      )}
      {attempt?.localRecordingReference && (
        <MissionRecordingPlayback reference={attempt.localRecordingReference} />
      )}
      <Text variant="title" style={[styles.accent, styles.centerText]}>
        {definition.type === "SPEAKING"
          ? "Your voice moved you forward."
          : "Your practice moved you forward."}
      </Text>
      <Button label="RETURN HOME" onPress={() => router.replace("/")} />
      <Button
        secondary
        label="VIEW QUESTS"
        onPress={() => router.replace("/quests")}
      />
    </Screen>
  );
}

function MissionExperience({
  definition,
  run,
  questId,
  saving,
  recording,
  onRecording,
  elapsedSeconds,
  onLeave,
  onResume,
  onAudioPlayed,
  onAnswer,
  onAdvance,
  onComplete,
}: {
  definition: MissionDefinition;
  run: MissionRun;
  questId: string;
  saving: boolean;
  recording: MissionRecording | null;
  onRecording: (recording: MissionRecording | null) => void;
  elapsedSeconds: number;
  onLeave: () => void;
  onResume: () => void;
  onAudioPlayed: () => void;
  onAnswer: (stepId: string, value: string) => void;
  onAdvance: (stepId: string) => void;
  onComplete: () => void;
}) {
  const step = definition.steps[run.currentStep];
  const answer = answeredStep(run, step.id);
  const completion = missionCompletion(definition, run, elapsedSeconds);
  const speaking = definition.type === "SPEAKING";
  const remaining = Math.max(
    0,
    definition.minimumActiveSeconds - elapsedSeconds,
  );
  return (
    <Screen>
      <MissionHeader
        title={definition.title}
        current={run.currentStep + 1}
        total={definition.steps.length}
        onLeave={onLeave}
      />
      {run.status === "PAUSED" && (
        <Card>
          <Text variant="label" style={styles.accent}>
            MISSION PAUSED
          </Text>
          <Text>Your current step and recorded time are safe.</Text>
          <Button label="RESUME MISSION" disabled={saving} onPress={onResume} />
        </Card>
      )}
      <View style={styles.timerCard}>
        <Text variant="label" style={styles.muted}>
          {speaking ? "TIME REMAINING" : "PRACTICE TIME"}
        </Text>
        <Text
          variant="display"
          style={speaking && remaining === 0 ? styles.accent : undefined}
        >
          {secondsLabel(speaking ? remaining : elapsedSeconds)}
        </Text>
        {speaking && (
          <ProgressBar
            progress={elapsedSeconds / definition.minimumActiveSeconds}
            label="Speaking time progress"
          />
        )}
      </View>
      {definition.passage && (
        <Card>
          <Text variant="label" style={styles.accent}>
            MESSAGE RECEIVED
          </Text>
          <Text style={styles.passage}>“{definition.passage}”</Text>
        </Card>
      )}
      {definition.type === "LISTENING" && definition.audioAssetId && (
        <Card>
          <MissionAudio
            assetId={definition.audioAssetId}
            played={run.audioPlayed}
            onPlayed={onAudioPlayed}
          />
        </Card>
      )}
      <View style={styles.stepCard}>
        <Text variant="label" style={styles.muted}>
          STEP {run.currentStep + 1} / {definition.steps.length}
        </Text>
        {step.kind === "PROMPT" ? (
          <>
            <Text variant="hero">“{step.prompt}”</Text>
            <Text style={styles.muted}>
              Speak freely. Clear communication grows through practice.
            </Text>
          </>
        ) : (
          <QuestionStep
            key={step.id}
            step={step}
            answer={answer}
            disabled={saving || run.status === "PAUSED"}
            onAnswer={(value) => onAnswer(step.id, value)}
          />
        )}
      </View>
      {speaking && (
        <Card>
          <SpeakingRecorder draft={recording} onDraft={onRecording} />
        </Card>
      )}
      {run.currentStep < definition.steps.length - 1 ? (
        <Button
          label="NEXT STEP"
          disabled={
            saving ||
            run.status === "PAUSED" ||
            !missionCanAdvance(definition, run)
          }
          onPress={() => onAdvance(step.id)}
        />
      ) : (
        <>
          <Button
            label={
              remaining > 0 && speaking
                ? `KEEP SPEAKING · ${secondsLabel(remaining)}`
                : "COMPLETE MISSION"
            }
            disabled={saving || run.status === "PAUSED" || !completion.allowed}
            onPress={onComplete}
          />
          {!completion.audioReady && (
            <Text variant="small" style={styles.muted}>
              Play the local audio before completing this mission.
            </Text>
          )}
        </>
      )}
      <SaveError />
    </Screen>
  );
}

export function MissionPlayerScreen() {
  const { questId: rawQuestId } = useLocalSearchParams<{ questId: string }>();
  const questId = Array.isArray(rawQuestId) ? rawQuestId[0] : rawQuestId;
  const router = useRouter();
  const { snapshot, missionAction, isSaving } = useGame();
  const journey = snapshot?.journey;
  const quest = journey?.quests.find((item) => item.id === questId);
  const definition = missionDefinition(quest?.interactiveMissionId ?? "");
  const active = journey?.missions?.active ?? null;
  const run = active?.questId === questId ? active : null;
  const { elapsedSeconds, elapsedRef } = useMissionTimer(run);
  const runRef = useRef(run);
  const [recording, setRecording] = useState<MissionRecording | null>(null);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const pause = useCallback(() => {
    const current = runRef.current;
    if (current?.status === "IN_PROGRESS")
      void missionAction({
        type: "pause",
        questId: current.questId,
        elapsedSeconds: elapsedRef.current,
      });
  }, [elapsedRef, missionAction]);

  useFocusEffect(
    useCallback(() => {
      return () => pause();
    }, [pause]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status !== "active") pause();
    });
    return () => subscription.remove();
  }, [pause]);

  function leave() {
    if (!run || run.status === "PAUSED") {
      router.back();
      return;
    }
    Alert.alert(
      "Leave mission?",
      "Your current step and elapsed time will be saved. You can continue later.",
      [
        { text: "Keep practicing", style: "cancel" },
        {
          text: "Save and leave",
          onPress: () => {
            pause();
            router.back();
          },
        },
      ],
    );
  }

  if (!journey || !quest || !definition || definition.type === "EXTERNAL")
    return (
      <Screen>
        <Card>
          <Text variant="title">Mission unavailable</Text>
          <Text style={styles.muted}>
            Return to your current Daily Quests and choose an interactive
            mission.
          </Text>
          <Button
            label="RETURN TO QUESTS"
            onPress={() => router.replace("/quests")}
          />
        </Card>
      </Screen>
    );

  if (quest.status === "completed")
    return <MissionResult definition={definition} questId={quest.id} />;

  if (active && active.questId !== quest.id) {
    return (
      <Screen>
        <Card>
          <Text variant="label" style={styles.accent}>
            MISSION IN PROGRESS
          </Text>
          <Text variant="title">
            Finish or pause your current mission first.
          </Text>
          <Text style={styles.muted}>
            Only one mission attempt can be active at a time, so rewards and
            timers stay consistent.
          </Text>
          <Button
            label="CONTINUE ACTIVE MISSION"
            onPress={() =>
              router.replace({
                pathname: "/mission/[questId]",
                params: { questId: active.questId },
              })
            }
          />
          <Button
            secondary
            label="RETURN TO QUESTS"
            onPress={() => router.back()}
          />
        </Card>
      </Screen>
    );
  }

  if (!run)
    return (
      <MissionIntro
        definition={definition}
        saving={isSaving}
        onLeave={() => router.back()}
        onStart={() => void missionAction({ type: "start", questId: quest.id })}
      />
    );

  return (
    <MissionExperience
      definition={definition}
      run={run}
      questId={quest.id}
      saving={isSaving}
      recording={recording}
      onRecording={setRecording}
      elapsedSeconds={elapsedSeconds}
      onLeave={leave}
      onResume={() => void missionAction({ type: "resume", questId: quest.id })}
      onAudioPlayed={() =>
        void missionAction({ type: "audioPlayed", questId: quest.id })
      }
      onAnswer={(stepId, value) => {
        const step = definition.steps.find((item) => item.id === stepId);
        const correct =
          step && step.kind !== "PROMPT" && step.kind !== "MANUAL_PRACTICE"
            ? value === step.correctOptionId
            : null;
        void answerHaptics(correct);
        void missionAction({
          type: "answer",
          questId: quest.id,
          stepId,
          value,
          elapsedSeconds,
        });
      }}
      onAdvance={(stepId) =>
        void missionAction({
          type: "advance",
          questId: quest.id,
          stepId,
          elapsedSeconds,
        })
      }
      onComplete={() =>
        void missionAction({
          type: "complete",
          questId: quest.id,
          elapsedSeconds,
          recording: recording ?? undefined,
        })
      }
    />
  );
}

const styles = StyleSheet.create({
  introIcon: {
    alignSelf: "center",
    width: 78,
    height: 78,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#3A4930",
  },
  resultMark: {
    alignSelf: "center",
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  centered: { alignItems: "center", gap: 9 },
  centerText: { textAlign: "center" },
  accent: { color: colors.accent },
  muted: { color: colors.muted },
  timerCard: {
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepCard: {
    gap: 16,
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passage: { fontSize: 17, lineHeight: 28, fontFamily: fonts.medium },
});
