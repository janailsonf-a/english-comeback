import { Flag, Map, Sprout } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Text } from "../../components/Text";
import { colors, fonts } from "../../theme/tokens";
import { PlaceholderScreen, previewStyles } from "./PlaceholderScreen";

const milestones = [1, 7, 14, 30, 60, 90];

export function JourneyScreen() {
  return (
    <PlaceholderScreen
      eyebrow="JOURNEY"
      title="Every step has a story."
      description="Your 90-day comeback will bring worlds, challenges, and moments to remember. This is a preview of the road ahead."
      icon={Map}
    >
      <View style={previewStyles.card}>
        <Text variant="label" style={previewStyles.muted}>
          PLANNED MILESTONES
        </Text>
        {milestones.map((day, index) => (
          <View key={day} style={styles.row}>
            <View style={styles.path}>
              <View style={[styles.dot, index === 0 && styles.first]}>
                {index === 0 ? (
                  <Sprout size={16} color={colors.accent} />
                ) : (
                  <Flag size={13} color={colors.subtle} />
                )}
              </View>
              {index < milestones.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.day}>DAY {day}</Text>
              <Text variant="small" style={previewStyles.muted}>
                {index === 0
                  ? "The Comeback · a new beginning"
                  : day === 90
                    ? "A new horizon"
                    : "A future chapter in your journey"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, minHeight: 60 },
  path: { width: 32, alignItems: "center" },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  first: { backgroundColor: colors.accentSoft, borderColor: "#5B713E" },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 6,
    marginBottom: -8,
  },
  content: { flex: 1, paddingTop: 2 },
  day: { fontSize: 12, letterSpacing: 1, fontFamily: fonts.bold },
});
