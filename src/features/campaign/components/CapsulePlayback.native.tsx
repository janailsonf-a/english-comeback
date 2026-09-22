import { useState } from "react";
import { View } from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import { campaignStyles } from "./CampaignUI";
export function CapsulePlayback({ reference }: { reference: string }) {
  const file = new File(Paths.document, reference);
  const player = useAudioPlayer(file.exists ? { uri: file.uri } : null);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  async function play() {
    try {
      if (!file.exists)
        throw new Error(
          "This recording is no longer available on this device. Its saved moment remains in your history.",
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
        label={status.playing ? "Pause Time Capsule" : "Play Time Capsule"}
        onPress={() => void play()}
      />
      {error && (
        <Text accessibilityRole="alert" style={campaignStyles.muted}>
          {error}
        </Text>
      )}
    </View>
  );
}
