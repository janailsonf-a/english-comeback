import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { Button } from "../../components/Button";
import { PROLOGUE } from "../game/journey/narrative/config";
import { useGame } from "../game/state/GameProvider";
import {
  Card,
  Heading,
  SaveError,
  campaignStyles,
} from "./components/CampaignUI";
import { CapsuleRecorder } from "./components/CapsuleRecorder";
export function PrologueScreen() {
  const { skipPrologue, saveTimeCapsule, isSaving } = useGame();
  return (
    <Screen>
      <Heading
        eyebrow="PROLOGUE"
        title={PROLOGUE.title}
        description="Before your journey begins, save this moment."
      />
      <Card>
        <Text variant="label" style={campaignStyles.accent}>
          YOUR FIRST TIME CAPSULE
        </Text>
        <Text variant="title">{PROLOGUE.prompt}</Text>
        <Text style={campaignStyles.muted}>
          This is a reference for your future self. There is no right score, no
          evaluation and no pressure to sound perfect.
        </Text>
        <CapsuleRecorder onSave={saveTimeCapsule} saving={isSaving} />
        <SaveError />
      </Card>
      <Button
        secondary
        label="Continue without recording"
        disabled={isSaving}
        onPress={() => void skipPrologue()}
      />
      <Text variant="small" style={campaignStyles.muted}>
        You can save a reflection later from Profile. Skipping does not create a
        recording or change your XP.
      </Text>
    </Screen>
  );
}
