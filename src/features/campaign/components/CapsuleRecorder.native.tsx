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
import { Mic, Square, Play } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import type { RecordingDraft } from "../../game/journey/narrative/types";
import { recordingReference } from "../../game/services/recordingReference";
import type { CapsuleRecorderProps } from "./CapsuleRecorder";
import { campaignStyles } from "./CampaignUI";

export function CapsuleRecorder({ onSave, saving }: CapsuleRecorderProps) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: "document",
  });
  const status = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer();
  const playback = useAudioPlayerStatus(player);
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
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
          "Microphone permission is needed to record. You can allow it in Settings or continue without recording.",
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
      setDraft(null);
      recorder.record();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Recording is unavailable. Please try again.",
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
        throw new Error("Please record a few seconds before saving.");
      const reference = recordingReference(uri, Paths.document.uri);
      if (!new File(Paths.document, reference).exists)
        throw new Error(
          "The local recording could not be found. Please record again.",
        );
      setDraft({ localRecordingReference: reference, durationSeconds });
      player.replace({ uri });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't finish recording. Please try again.",
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
  async function save() {
    if (!draft) return;
    player.pause();
    if (await onSave(draft)) setDraft(null);
  }
  const disabled = busy || saving;
  return (
    <View style={{ gap: 12 }}>
      <Text variant="title">
        {status.isRecording
          ? `Recording · ${Math.floor(status.durationMillis / 1000)}s`
          : draft
            ? `Your reflection · ${Math.ceil(draft.durationSeconds)}s`
            : "Capture this moment."}
      </Text>
      <Text variant="small" style={campaignStyles.muted}>
        Only on this device. No upload, transcription or score.
      </Text>
      {status.isRecording ? (
        <Button
          icon={Square}
          label="STOP"
          disabled={disabled}
          onPress={() => void stop()}
        />
      ) : draft ? (
        <>
          <Button
            secondary
            icon={Play}
            label={playback.playing ? "Pause recording" : "PLAY"}
            disabled={disabled}
            onPress={() => void play()}
          />
          <Button
            label="SAVE TIME CAPSULE"
            disabled={disabled}
            onPress={() => void save()}
          />
          <Button
            secondary
            label="RECORD AGAIN"
            disabled={disabled}
            onPress={() => void start()}
          />
        </>
      ) : (
        <Button
          icon={Mic}
          label="START RECORDING"
          disabled={disabled}
          onPress={() => void start()}
        />
      )}
      {error && (
        <Text accessibilityRole="alert" style={campaignStyles.muted}>
          {error}
        </Text>
      )}
    </View>
  );
}
