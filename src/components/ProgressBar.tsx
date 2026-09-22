import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { colors, radius } from "../theme/tokens";

export function ProgressBar({
  progress,
  color = colors.accent,
  label,
  height = 8,
  initialProgress,
}: {
  progress: number;
  color?: string;
  label: string;
  height?: number;
  initialProgress?: number;
}) {
  const value = Math.max(0, Math.min(1, progress));
  const [animation] = useState(
    () =>
      new Animated.Value(
        initialProgress === undefined
          ? value
          : Math.max(0, Math.min(1, initialProgress)),
      ),
  );
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const transition = Animated.timing(animation, {
      toValue: value,
      duration: reducedMotion ? 0 : 500,
      useNativeDriver: false,
    });
    transition.start();
    return () => transition.stop();
  }, [animation, value, reducedMotion]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { height }]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: animation.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: "#303A32",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },
});
