import { useState } from "react";
import { View } from "react-native";
import { Text } from "../../../components/Text";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import {
  PROLOGUE,
  CAPSULE_CHECKPOINTS,
} from "../../game/journey/narrative/config";
import { useGame } from "../../game/state/GameProvider";
import { CapsuleRecorder } from "./CapsuleRecorder";
import { CapsulePlayback } from "./CapsulePlayback";
import { Card, SaveError, campaignStyles } from "./CampaignUI";
export function TimeCapsulesCard() {
  const { snapshot, saveTimeCapsule, isSaving } = useGame();
  const [open, setOpen] = useState(false);
  const capsules = snapshot?.journey?.narrative?.timeCapsules ?? [];
  return (
    <>
      <Card>
        <Text variant="title">Time Capsules</Text>
        <Text style={campaignStyles.muted}>
          Hear your own journey. These moments have no automatic English score.
        </Text>
        {!capsules.length && (
          <Text variant="small" style={campaignStyles.muted}>
            Your first saved reflection will appear here.
          </Text>
        )}
        {capsules.map((c) => (
          <View key={c.id} style={{ gap: 8 }}>
            <Text style={campaignStyles.accent}>
              {c.type === "prologue" ? "PROLOGUE" : `STUDY DAY ${c.studyDay}`} ·{" "}
              {new Date(c.createdAt).toLocaleDateString()}
            </Text>
            <Text>{c.prompt}</Text>
            {c.localRecordingReference ? (
              <>
                <Text variant="small" style={campaignStyles.muted}>
                  {Math.ceil(c.durationSeconds)}s · LOCAL RECORDING
                </Text>
                <CapsulePlayback reference={c.localRecordingReference} />
              </>
            ) : (
              <Text variant="small" style={campaignStyles.muted}>
                Development placeholder · no audio was recorded.
              </Text>
            )}
          </View>
        ))}
        <Button
          secondary
          label="Save a new reflection"
          onPress={() => setOpen(true)}
        />
        <Text variant="small" style={campaignStyles.muted}>
          Future checkpoints ·{" "}
          {CAPSULE_CHECKPOINTS.map((c) => `Day ${c.studyDay}`).join(" / ")}
        </Text>
      </Card>
      <Sheet
        visible={open}
        label="New Time Capsule"
        onClose={() => setOpen(false)}
      >
        <Text variant="label" style={campaignStyles.accent}>
          TIME CAPSULE · STUDY DAY {snapshot?.journey?.studyDays}
        </Text>
        <Text variant="title">{PROLOGUE.prompt}</Text>
        {open && (
          <CapsuleRecorder
            saving={isSaving}
            onSave={async (draft) => {
              const saved = await saveTimeCapsule(draft);
              if (saved) setOpen(false);
              return saved;
            }}
          />
        )}
        <SaveError />
      </Sheet>
    </>
  );
}
