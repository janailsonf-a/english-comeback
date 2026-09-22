import { useState } from "react";
import { View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import { Pause, Play } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import { colors } from "../../../theme/tokens";

export function MissionRecordingPlayback({ reference }: { reference: string }) {
  const file = new File(Paths.document, reference);
  const player = useAudioPlayer(file.exists ? { uri: file.uri } : null);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    try {
      if (!file.exists)
        throw new Error(
          "This recording is no longer available on this device.",
        );
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      if (status.playing) player.pause();
      else {
        await player.seekTo(0);
        player.play();
      }
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Playback is unavailable.",
      );
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Button
        secondary
        icon={status.playing ? Pause : Play}
        label={status.playing ? "PAUSE PLAYBACK" : "PLAY MY RECORDING"}
        onPress={() => void toggle()}
      />
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.muted }}>
          {error}
        </Text>
      )}
    </View>
  );
}
