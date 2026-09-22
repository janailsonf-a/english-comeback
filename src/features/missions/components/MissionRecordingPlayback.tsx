import { Text } from "../../../components/Text";
import { colors } from "../../../theme/tokens";

export function MissionRecordingPlayback({
  reference: _reference,
}: {
  reference: string;
}) {
  return (
    <Text variant="small" style={{ color: colors.muted }}>
      Play this local recording on the phone where you completed the mission.
    </Text>
  );
}
