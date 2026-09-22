import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
export async function rewardHaptics(milestone: boolean) {
  if (Platform.OS === "web") return;
  try {
    if (milestone)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* Devices without haptics keep the visual feedback. */
  }
}
