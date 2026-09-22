import { needsPrologue } from "../../game/journey/narrative/rules";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Award, LockKeyhole } from "lucide-react-native";
import { Button } from "../../../components/Button";
import { Text } from "../../../components/Text";
import { colors, radius } from "../../../theme/tokens";
import { useGame } from "../../game/state/GameProvider";
import type { Achievement } from "../../game/journey/types";

export function Card({ children }: PropsWithChildren) {
  return <View style={campaignStyles.card}>{children}</View>;
}
export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={campaignStyles.heading}>
      <Text variant="label" style={campaignStyles.accent}>
        ENGLISH COMEBACK / {eyebrow}
      </Text>
      <Text variant="hero">{title}</Text>
      <Text style={campaignStyles.muted}>{description}</Text>
    </View>
  );
}
export function JourneyGate({ children }: PropsWithChildren) {
  const { snapshot, error } = useGame();
  const router = useRouter();
  if (!snapshot)
    return (
      <Card>
        {error ? (
          <Text accessibilityRole="alert">{error}</Text>
        ) : (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text>Preparing your comeback…</Text>
          </>
        )}
      </Card>
    );
  if (!snapshot.journey?.startedAt)
    return (
      <Card>
        <Text variant="title">Your adventure starts here.</Text>
        <Text style={campaignStyles.muted}>
          Start your journey on Home. Every step you record will stay with you.
        </Text>
        <Button
          label="Go to Start My Journey"
          onPress={() => router.navigate("/")}
        />
      </Card>
    );
  if (needsPrologue(snapshot.journey))
    return (
      <Card>
        <Text variant="title">Save your starting moment.</Text>
        <Text style={campaignStyles.muted}>
          Your Prologue is waiting on Home. You can record a reflection or
          continue without one.
        </Text>
        <Button label="Go to Prologue" onPress={() => router.navigate("/")} />
      </Card>
    );
  return children;
}
export function SaveError() {
  const { saveError } = useGame();
  return saveError ? (
    <Text accessibilityRole="alert" style={{ color: colors.amber }}>
      {saveError}
    </Text>
  ) : null;
}
export function AchievementGallery({
  achievements,
}: {
  achievements: Achievement[];
}) {
  return (
    <Card>
      <Text variant="title">Achievements</Text>
      {achievements
        .filter((a) => !a.hidden || a.unlocked)
        .map((a) => (
          <View key={a.id} style={campaignStyles.row}>
            {a.unlocked ? (
              <Award size={22} color={colors.accent} />
            ) : (
              <LockKeyhole size={20} color={colors.subtle} />
            )}
            <View style={campaignStyles.flex}>
              <Text
                style={
                  a.unlocked ? campaignStyles.accent : campaignStyles.muted
                }
              >
                {a.title}
              </Text>
              <Text variant="small" style={campaignStyles.muted}>
                {a.description}
              </Text>
              {a.unlockedAt && (
                <Text variant="small" style={campaignStyles.muted}>
                  Unlocked · {new Date(a.unlockedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            <Text variant="small" style={campaignStyles.muted}>
              {a.unlocked ? "UNLOCKED" : "LOCKED"}
            </Text>
          </View>
        ))}
    </Card>
  );
}
export function DevelopmentBadge({ visible }: { visible: boolean }) {
  return visible ? (
    <Text variant="small" style={{ color: colors.amber }}>
      Development data · simulated activity is included. Reset to start a real
      journey.
    </Text>
  ) : null;
}
export const campaignStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: radius.card,
    gap: 16,
  },
  heading: { gap: 12, paddingTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1, gap: 4 },
  muted: { color: colors.muted },
  accent: { color: colors.accent },
  section: { gap: 12 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: {
    minWidth: "44%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.small,
    padding: 16,
    gap: 6,
  },
});
