import { ArrowUpRight, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { colors, fonts, radius } from "../theme/tokens";
import { Text } from "./Text";

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  icon?: LucideIcon;
}

export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
  icon: Icon = ArrowUpRight,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>
        {label}
      </Text>
      <Icon size={18} color={secondary ? colors.accent : colors.background} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.small,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondary: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#3A4930",
  },
  label: { color: colors.background, fontFamily: fonts.bold },
  secondaryLabel: { color: colors.accent },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
