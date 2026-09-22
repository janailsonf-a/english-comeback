import { useState } from "react";
import { View } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import { colors } from "../../../theme/tokens";
import { recordingReference } from "../../game/services/recordingReference";
import type { SpeakingRecorderProps } from "./SpeakingRecorder";

export function SpeakingRecorder({ draft, onDraft }: SpeakingRecorderProps) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: "document",
  });
  const status = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer();
  const playback = useAudioPlayerStatus(player);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      player.pause();
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Microphone permission is needed to record. You can continue with the mission timer without recording.",
        );
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await recorder.prepareToRecordAsync();
      if (draft) {
        const file = new File(Paths.document, draft.localRecordingReference);
        if (file.exists) file.delete();
      }
      onDraft(null);
      recorder.record();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Recording is unavailable. The mission timer still works.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    setError(null);
    try {
      const durationSeconds = Math.max(
        recorder.currentTime,
        recorder.getStatus().durationMillis / 1000,
      );
      await recorder.stop();
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      const uri = recorder.uri;
      if (!uri || durationSeconds <= 0)
        throw new Error("Please record a few seconds before stopping.");
      const reference = recordingReference(uri, Paths.document.uri);
      if (!new File(Paths.document, reference).exists)
        throw new Error("The local recording could not be found.");
      onDraft({ localRecordingReference: reference, durationSeconds });
      player.replace({ uri });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't finish this recording. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function play() {
    setError(null);
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      if (playback.playing) player.pause();
      else {
        await player.seekTo(0);
        player.play();
      }
    } catch {
      setError("Playback is unavailable. Your local recording is still here.");
    }
  }

  const disabled = busy;
  return (
    <View style={{ gap: 10 }}>
      <Text variant="label" style={{ color: colors.accent }}>
        OPTIONAL LOCAL RECORDING
      </Text>
      <Text variant="small" style={{ color: colors.muted }}>
        Recording helps you hear yourself. It stays on this device and receives
        no transcription, pronunciation analysis or score.
      </Text>
      {status.isRecording ? (
        <Button
          icon={Square}
          label={`STOP RECORDING · ${Math.floor(status.durationMillis / 1000)}s`}
          disabled={disabled}
          onPress={() => void stop()}
        />
      ) : draft ? (
        <>
          <Button
            secondary
            icon={playback.playing ? Pause : Play}
            label={playback.playing ? "PAUSE PLAYBACK" : "PLAYBACK"}
            disabled={disabled}
            onPress={() => void play()}
          />
          <Button
            secondary
            icon={RotateCcw}
            label="RECORD AGAIN"
            disabled={disabled}
            onPress={() => void start()}
          />
        </>
      ) : (
        <Button
          secondary
          icon={Mic}
          label="START RECORDING"
          disabled={disabled}
          onPress={() => void start()}
        />
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.amber }}>
          {error}
        </Text>
      )}
    </View>
  );
}
