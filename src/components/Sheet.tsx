import { X } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { colors, radius } from "../theme/tokens";

export function Sheet({
  children,
  visible,
  onClose,
  label,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  label: string;
}>) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  return (
    <Modal
      transparent
      visible={visible}
      animationType={reducedMotion ? "none" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={styles.handle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            hitSlop={8}
            onPress={onClose}
            style={styles.close}
          >
            <X size={22} color={colors.muted} />
          </Pressable>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000BB",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 644,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card + 8,
    borderTopRightRadius: radius.card + 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 16,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: 30,
  },
  close: {
    position: "absolute",
    right: 14,
    top: 24,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  content: { paddingHorizontal: 26, paddingBottom: 8, gap: 20 },
});
