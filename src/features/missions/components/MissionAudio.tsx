import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Pause, Play, RotateCcw } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { ProgressBar } from "../../../components/ProgressBar";
import { Text } from "../../../components/Text";
import { colors } from "../../../theme/tokens";
import type { MissionDefinition } from "../../game/missions/types";

const AUDIO_ASSETS = {
  "daniel-intro": require("../../../../assets/missions/daniel-intro.wav"),
  "meeting-message": require("../../../../assets/missions/meeting-message.wav"),
} as const;

export function MissionAudio({
  assetId,
  played,
  onPlayed,
}: {
  assetId: NonNullable<MissionDefinition["audioAssetId"]>;
  played: boolean;
  onPlayed: () => void;
}) {
  const player = useAudioPlayer(AUDIO_ASSETS[assetId], {
    updateInterval: 250,
  });
  const status = useAudioPlayerStatus(player);
  const reported = useRef(played);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !reported.current &&
      (status.currentTime >= 0.5 || status.didJustFinish)
    ) {
      reported.current = true;
      onPlayed();
    }
  }, [status.currentTime, status.didJustFinish, onPlayed]);

  async function toggle() {
    setError(null);
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      if (status.playing) player.pause();
      else {
        if (status.didJustFinish) await player.seekTo(0);
        player.play();
      }
    } catch {
      setError("Local audio is unavailable. Please try again.");
    }
  }

  async function replay() {
    setError(null);
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      setError("Local audio is unavailable. Please try again.");
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="label" style={styles.accent}>
            LOCAL AUDIO
          </Text>
          <Text variant="small" style={styles.muted}>
            {Math.floor(status.currentTime)}s /{" "}
            {Math.ceil(status.duration || 0)}s{played ? " · LISTENED" : ""}
          </Text>
        </View>
        <Text variant="small" style={styles.muted}>
          OFFLINE
        </Text>
      </View>
      <ProgressBar
        progress={status.duration ? status.currentTime / status.duration : 0}
        label="Listening audio progress"
        height={5}
      />
      <Button
        icon={status.playing ? Pause : Play}
        label={status.playing ? "PAUSE AUDIO" : "PLAY AUDIO"}
        onPress={() => void toggle()}
      />
      {status.currentTime > 0 && !status.playing && (
        <Button
          secondary
          icon={RotateCcw}
          label="PLAY FROM START"
          onPress={() => void replay()}
        />
      )}
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1, gap: 3 },
  accent: { color: colors.accent },
  muted: { color: colors.muted },
  error: { color: colors.amber },
});
