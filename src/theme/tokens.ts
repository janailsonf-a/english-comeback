export const colors = {
  background: "#0B0E13",
  surface: "#141920",
  elevated: "#1B222C",
  border: "#29313D",
  text: "#F5F7FA",
  muted: "#A5AEBC",
  subtle: "#737F90",
  accent: "#C7F36B",
  accentSoft: "#232F20",
  violet: "#BAAAFF",
  violetSoft: "#29233C",
  blue: "#8EC9FF",
  blueSoft: "#1D2C3B",
  amber: "#F7C882",
  amberSoft: "#352A20",
} as const;

export const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  display: "SpaceGrotesk_700Bold",
} as const;

export const radius = { small: 12, card: 22, pill: 100 } as const;
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
