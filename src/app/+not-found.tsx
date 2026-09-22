import { Compass } from "lucide-react-native";
import { PlaceholderScreen } from "../features/placeholders/PlaceholderScreen";

export default function NotFound() {
  return (
    <PlaceholderScreen
      eyebrow="LOST PATH"
      title="Let’s find your way back."
      description="This page is not part of your journey. Your daily quests are waiting on Home."
      icon={Compass}
    />
  );
}
