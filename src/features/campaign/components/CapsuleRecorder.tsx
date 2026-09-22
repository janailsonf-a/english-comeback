import type { RecordingDraft } from "../../game/journey/narrative/types";
import { Text } from "../../../components/Text";
import { campaignStyles } from "./CampaignUI";
export interface CapsuleRecorderProps {
  onSave: (draft: RecordingDraft) => Promise<boolean>;
  saving: boolean;
}
export function CapsuleRecorder(_props: CapsuleRecorderProps) {
  return (
    <Text style={campaignStyles.muted}>
      Local recording is available in Expo Go on your phone. You can continue
      without recording here; no audio or English score will be created.
    </Text>
  );
}
