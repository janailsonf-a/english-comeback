import { Text } from "../../../components/Text";
import { campaignStyles } from "./CampaignUI";
export function CapsulePlayback({
  reference: _reference,
}: {
  reference: string;
}) {
  return (
    <Text variant="small" style={campaignStyles.muted}>
      Play this local recording on the phone where you saved it.
    </Text>
  );
}
