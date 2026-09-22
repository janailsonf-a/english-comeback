import { Text } from "../../../components/Text";
import { colors } from "../../../theme/tokens";
import type { MissionRecording } from "../../game/missions/types";

export interface SpeakingRecorderProps {
  draft: MissionRecording | null;
  onDraft: (draft: MissionRecording | null) => void;
}

export function SpeakingRecorder(_props: SpeakingRecorderProps) {
  return (
    <Text variant="small" style={{ color: colors.muted }}>
      Local recording is available in Expo Go on your phone. The timer can still
      complete this practice here; no score will be generated.
    </Text>
  );
}
