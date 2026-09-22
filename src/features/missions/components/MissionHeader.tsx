import { Pressable, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { ProgressBar } from "../../../components/ProgressBar";
import { Text } from "../../../components/Text";
import { colors, radius } from "../../../theme/tokens";

export function MissionHeader({
  title,
  current,
  total,
  onLeave,
}: {
  title: string;
  current: number;
  total: number;
  onLeave: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="label" style={styles.accent}>
            INTERACTIVE MISSION
          </Text>
          <Text numberOfLines={1}>{title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave mission"
          hitSlop={10}
          onPress={onLeave}
          style={styles.close}
        >
          <X size={20} color={colors.muted} />
        </Pressable>
      </View>
      <ProgressBar
        progress={current / total}
        label={`Mission step ${current} of ${total}`}
        height={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1, gap: 2 },
  accent: { color: colors.accent },
  close: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
