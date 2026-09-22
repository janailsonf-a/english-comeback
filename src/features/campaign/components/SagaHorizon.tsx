import { View } from "react-native";
import { LockKeyhole, Trophy } from "lucide-react-native";
import { Text } from "../../../components/Text";
import { colors } from "../../../theme/tokens";
import { SAGA } from "../../game/journey/narrative/config";
import {
  campaignState,
  projectedCompletion,
} from "../../game/journey/narrative/selectors";
import type { JourneyState } from "../../game/journey/types";
import { Card, campaignStyles } from "./CampaignUI";

export function CampaignIdentity({ journey }: { journey: JourneyState }) {
  const current = campaignState(journey).find((c) => c.status === "ACTIVE");
  return (
    <Card>
      <Text variant="label" style={campaignStyles.accent}>
        ENGLISH COMEBACK {current?.numeral} · ACTIVE
      </Text>
      <Text variant="hero">{current?.title}</Text>
      <Text style={campaignStyles.muted}>{current?.purpose}</Text>
      <Text variant="small" style={campaignStyles.muted}>
        Your levels, titles and history belong to your whole story.
      </Text>
    </Card>
  );
}
export function SagaHorizon({ journey }: { journey: JourneyState }) {
  return (
    <View
      style={{
        gap: 24,
        paddingTop: 28,
        borderTopWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text variant="label" style={campaignStyles.muted}>
        BEYOND THE AWAKENING
      </Text>
      {campaignState(journey)
        .filter((c) => c.status === "LOCKED")
        .map((c) => (
          <Card key={c.id}>
            <View style={campaignStyles.row}>
              <LockKeyhole color={colors.subtle} size={18} />
              <Text variant="label" style={campaignStyles.muted}>
                ENGLISH COMEBACK {c.numeral} · LOCKED
              </Text>
            </View>
            <Text variant="title">{c.title}</Text>
            <Text style={campaignStyles.muted}>{c.purpose}</Text>
          </Card>
        ))}
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 32 }}>
        <Trophy color={colors.accent} size={32} />
        <Text variant="title">{SAGA.horizon}</Text>
        <Text variant="label" style={campaignStyles.accent}>
          {SAGA.horizonStatus}
        </Text>
        <Text
          variant="small"
          style={[campaignStyles.muted, { textAlign: "center", maxWidth: 320 }]}
        >
          {SAGA.context}
        </Text>
      </View>
    </View>
  );
}
export function ProjectionCard({
  journey,
  today,
}: {
  journey: JourneyState;
  today: string;
}) {
  const projection = projectedCompletion(journey, today);
  return (
    <Card>
      <Text variant="label" style={campaignStyles.accent}>
        PROJECTED COMPLETION
      </Text>
      <Text variant="title">
        {projection.status === "building"
          ? "Building your projection..."
          : projection.status === "complete"
            ? "The Awakening complete."
            : `About ${projection.weeksRemaining} weeks remaining`}
      </Text>
      <Text variant="small" style={campaignStyles.muted}>
        {projection.status === "estimate"
          ? `At your current pace: ${projection.studyDaysCompleted} Study Days across ${projection.observedDays} calendar days. This campaign estimate changes with your rhythm.`
          : projection.status === "complete"
            ? "Every completed step remains in your story."
            : "A few study dates over at least a week will help us estimate your campaign pace."}
      </Text>
      <Text variant="small" style={campaignStyles.muted}>
        Estimate for the 90 Study Day campaign. Later worlds are still coming
        soon.
      </Text>
    </Card>
  );
}
