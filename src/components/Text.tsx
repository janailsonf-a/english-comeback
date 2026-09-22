import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { colors, fonts } from "../theme/tokens";

type Variant = "body" | "small" | "label" | "title" | "hero" | "display";

export function Text({
  variant = "body",
  style,
  ...props
}: TextProps & { variant?: Variant }) {
  return (
    <NativeText {...props} style={[styles.base, styles[variant], style]} />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text, fontFamily: fonts.regular },
  body: { fontSize: 14, lineHeight: 23 },
  small: { fontSize: 12, lineHeight: 19 },
  label: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.8,
    fontFamily: fonts.bold,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.display,
    letterSpacing: -0.5,
  },
  hero: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fonts.display,
    letterSpacing: -1.1,
  },
  display: {
    fontSize: 64,
    lineHeight: 76,
    fontFamily: fonts.display,
    letterSpacing: -3,
  },
});
