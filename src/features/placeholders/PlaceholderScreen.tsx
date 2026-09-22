import {
  ArrowUpRight,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "../../components/Button";
import { Screen } from "../../components/Screen";
import { Text } from "../../components/Text";
import { colors, radius } from "../../theme/tokens";

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}>) {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="label" style={styles.accent}>
          ENGLISH COMEBACK / {eyebrow}
        </Text>
        <View style={styles.icon}>
          <Icon size={28} color={colors.accent} strokeWidth={1.5} />
        </View>
        <Text variant="hero">{title}</Text>
        <Text style={styles.muted}>{description}</Text>
      </View>
      {children}
      <View style={styles.future}>
        <LockKeyhole size={16} color={colors.muted} />
        <View style={styles.futureText}>
          <Text variant="small">A future chapter</Text>
          <Text variant="small" style={styles.muted}>
            This area is a preview. Your playable quests are on Home.
          </Text>
        </View>
      </View>
      <Button
        secondary
        label="Back to my daily quests"
        icon={ArrowUpRight}
        onPress={() => router.navigate("/")}
      />
    </Screen>
  );
}

export const previewStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    borderRadius: radius.card,
    gap: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1, gap: 2 },
  muted: { color: colors.muted },
  accent: { color: colors.accent },
});

const styles = StyleSheet.create({
  header: { gap: 14, paddingTop: 8 },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    marginVertical: 8,
  },
  accent: { color: colors.accent },
  muted: { color: colors.muted },
  future: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    padding: 18,
    borderRadius: radius.small,
  },
  futureText: { flex: 1, gap: 4 },
});
