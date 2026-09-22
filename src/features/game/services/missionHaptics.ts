import * as Haptics from "expo-haptics";

export async function answerHaptics(correct: boolean | null) {
  try {
    if (correct === null) await Haptics.selectionAsync();
    else
      await Haptics.notificationAsync(
        correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
  } catch {
    // Haptics are optional on unsupported devices and web.
  }
}
