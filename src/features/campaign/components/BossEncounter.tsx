import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Shield, Check, LockKeyhole } from "lucide-react-native";
import { BossPortrait } from "../../../components/Illustrations";
import { ProgressBar } from "../../../components/ProgressBar";
import { Text } from "../../../components/Text";
import { Button } from "../../../components/Button";
import { Sheet } from "../../../components/Sheet";
import { colors } from "../../../theme/tokens";
import { SILENCE } from "../../game/journey/config";
import { bossHp } from "../../game/journey/selectors";
import { bossPreparation } from "../../game/missions/selectors";
import type { JourneyState } from "../../game/journey/types";
import { useGame } from "../../game/state/GameProvider";
import { Card, SaveError, campaignStyles } from "./CampaignUI";
export function BossEncounter({ journey }: { journey: JourneyState }) {
  const [open, setOpen] = useState(false);
  const { completeBossStep, isSaving } = useGame();
  const unlocked = journey.studyDays >= SILENCE.unlockStudyDays;
  const defeated = Boolean(journey.boss.defeatedAt);
  const hp = bossHp(journey);
  const preparation = bossPreparation(journey);
  const nextStep = SILENCE.steps.find(
    (s) => !journey.boss.completedSteps.includes(s.id),
  );
  async function finish(id: string) {
    if ((await completeBossStep(id)) && id === SILENCE.steps.at(-1)?.id)
      setOpen(false);
  }
  return (
    <>
      <Card>
        <View style={campaignStyles.row}>
          <Shield size={18} color={colors.violet} />
          <Text variant="label" style={{ color: colors.violet }}>
            {defeated
              ? "BOSS DEFEATED"
              : unlocked
                ? "BOSS UNLOCKED"
                : "BOSS APPROACHING"}
          </Text>
        </View>
        <View style={campaignStyles.row}>
          <View style={campaignStyles.flex}>
            <Text variant="title">{SILENCE.name}</Text>
            <Text style={campaignStyles.muted}>{SILENCE.objective}</Text>
            <Text variant="small" style={{ color: colors.violet }}>
              +{SILENCE.xpReward} XP · I FOUND MY VOICE
            </Text>
          </View>
          <BossPortrait size={90} />
        </View>
        {!defeated && (
          <View style={{ gap: 7 }}>
            <Text variant="label" style={campaignStyles.muted}>
              PREPARING FOR: THE SILENCE
            </Text>
            <Text variant="small" style={campaignStyles.muted}>
              Speaking missions completed · {preparation.completed} /{" "}
              {preparation.target}
            </Text>
            <ProgressBar
              progress={preparation.completed / preparation.target}
              color={colors.accent}
              label="Speaking mission Boss preparation"
              height={5}
            />
            <Text variant="small" style={campaignStyles.muted}>
              Preparation builds confidence. Boss HP changes only inside the
              battle.
            </Text>
          </View>
        )}
        <Text variant="small" style={campaignStyles.muted}>
          {unlocked
            ? `${hp} / ${SILENCE.hp} HP`
            : `${journey.studyDays} / ${SILENCE.unlockStudyDays} Study Days to unlock`}
        </Text>
        <ProgressBar
          progress={
            unlocked
              ? hp / SILENCE.hp
              : journey.studyDays / SILENCE.unlockStudyDays
          }
          color={colors.violet}
          label={
            unlocked
              ? `${SILENCE.name} ${hp} HP remaining`
              : `${SILENCE.name} Study Day unlock progress`
          }
        />
        {unlocked && !defeated ? (
          <Button
            label={
              journey.boss.completedSteps.length
                ? "Continue Boss Battle"
                : "Enter Boss Battle"
            }
            onPress={() => setOpen(true)}
          />
        ) : (
          <Text variant="small" style={campaignStyles.muted}>
            {defeated
              ? "World 01 complete. Find Your Voice is unlocked."
              : "Finish World 01's Study Days. Your voice will be ready."}
          </Text>
        )}
      </Card>
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        label="THE SILENCE Boss Battle"
      >
        <Text variant="label" style={{ color: colors.violet }}>
          WORLD 01 · BOSS BATTLE
        </Text>
        <Text variant="hero">THE SILENCE</Text>
        <Text variant="title">
          {hp} / {SILENCE.hp} HP
        </Text>
        <ProgressBar
          progress={hp / SILENCE.hp}
          color={colors.violet}
          label={`Boss Battle ${hp} HP remaining`}
        />
        <Text style={campaignStyles.muted}>
          Speak for one minute at each step: five minutes altogether. Confirm
          after practicing. There is no voice recognition or proficiency
          assessment.
        </Text>
        {SILENCE.steps.map((step, index) => {
          const done = journey.boss.completedSteps.includes(step.id);
          return (
            <View key={step.id} style={[styles.step, done && styles.done]}>
              <View style={campaignStyles.row}>
                {done ? (
                  <Check size={20} color={colors.accent} />
                ) : step.id === nextStep?.id ? (
                  <Shield size={20} color={colors.violet} />
                ) : (
                  <LockKeyhole size={20} color={colors.subtle} />
                )}
                <View style={campaignStyles.flex}>
                  <Text>
                    {index + 1}. {step.title}
                  </Text>
                  <Text variant="small" style={campaignStyles.muted}>
                    1 min · {step.damage} damage {done ? "· COMPLETED" : ""}
                  </Text>
                </View>
              </View>
              {step.id === nextStep?.id && (
                <Button
                  label={`Complete step: ${step.title}`}
                  disabled={isSaving}
                  onPress={() => void finish(step.id)}
                />
              )}
            </View>
          );
        })}
        <SaveError />
      </Sheet>
    </>
  );
}
const styles = StyleSheet.create({
  step: {
    gap: 12,
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 12,
  },
  done: { backgroundColor: colors.accentSoft },
});
