import { SILENCE } from "../../game/journey/config";
import { DEVELOPMENT_PACE } from "../../game/journey/narrative/config";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import { Text } from "../../../components/Text";
import { useGame } from "../../game/state/GameProvider";
import type { DeveloperAction } from "../../game/journey/developerActions";
import { SaveError, campaignStyles } from "./CampaignUI";
export function DeveloperPanel() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { developerAction, resetJourney, isSaving, snapshot } = useGame();
  if (!__DEV__) return null;
  const actions: { label: string; action: DeveloperAction }[] = [
    { label: "Complete Prologue without audio", action: "completePrologue" },
    { label: "Unlock THE RETURNER title", action: "unlockTitle" },
    { label: "Advance Chapter through quests", action: "advanceChapter" },
    { label: "Create Mock Time Capsule (no audio)", action: "mockCapsule" },
    { label: "Simulate Journey Pace (3 dates)", action: "simulatePace" },
    { label: "Advance Study Day", action: "advanceDay" },
    { label: "Add 100 XP", action: "addXp" },
    { label: "Simulate 7 days inactivity", action: "inactivity" },
    { label: "Add Rest Token", action: "addToken" },
    { label: "Remove Rest Token", action: "removeToken" },
    { label: "Unlock Boss through 14 Study Days", action: "unlockBoss" },
  ];
  async function reset() {
    if (await resetJourney(true)) {
      setConfirm(false);
      setOpen(false);
    }
  }
  return (
    <>
      <Button
        secondary
        label="Development tools"
        onPress={() => setOpen(true)}
      />
      <Sheet
        visible={open}
        label="Developer Panel"
        onClose={() => {
          setOpen(false);
          setConfirm(false);
        }}
      >
        <Text variant="label" style={campaignStyles.accent}>
          DEVELOPMENT ONLY
        </Text>
        <Text variant="hero">Developer Panel</Text>
        <Text style={campaignStyles.muted}>
          Progression shortcuts run the real game rules and mark this journey as
          development data. Inactivity advances a simulated clock; reset to
          return to a real journey.
        </Text>
        {confirm ? (
          <>
            <Text variant="title">Reset this journey?</Text>
            <Text>
              Your saved journey, XP, study history, Boss progress and
              achievements, Titles and Time Capsule references will be cleared.
              The old MVP demo archive stays intact.
            </Text>
            <Button
              label="Confirm RESET JOURNEY"
              disabled={isSaving}
              onPress={() => void reset()}
            />
            <Button
              secondary
              label="Cancel reset"
              onPress={() => setConfirm(false)}
            />
          </>
        ) : (
          <>
            {actions.map((item) => (
              <Button
                secondary
                key={item.action}
                label={item.label}
                disabled={
                  isSaving ||
                  !snapshot?.journey?.startedAt ||
                  (item.action === "simulatePace" &&
                    (snapshot?.journey?.studyDays ?? 0) >
                      SILENCE.unlockStudyDays -
                        DEVELOPMENT_PACE.completionOffsets.length)
                }
                onPress={() => {
                  setOpen(false);
                  void developerAction(item.action);
                }}
              />
            ))}
            <Button
              label="RESET JOURNEY"
              disabled={isSaving}
              onPress={() => setConfirm(true)}
            />
          </>
        )}
        <SaveError />
      </Sheet>
    </>
  );
}
