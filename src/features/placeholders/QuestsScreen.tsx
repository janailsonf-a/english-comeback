import { BookOpen, Headphones, Mic, ScrollText } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "../../components/Text";
import { colors } from "../../theme/tokens";
import {
  PlaceholderScreen,
  previewStyles as styles,
} from "./PlaceholderScreen";

const categories = [
  {
    title: "Listening",
    detail: "Train your ears for real English.",
    icon: Headphones,
    color: colors.blue,
  },
  {
    title: "Speaking",
    detail: "Build the habit of using your voice.",
    icon: Mic,
    color: colors.violet,
  },
  {
    title: "Study & grammar",
    detail: "Give your practice a strong foundation.",
    icon: BookOpen,
    color: colors.amber,
  },
];

export function QuestsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="QUESTS"
      title="Choose your adventure."
      description="A future home for missions across every world. For now, start small with your daily quests."
      icon={ScrollText}
    >
      <View style={styles.card}>
        <Text variant="label" style={styles.muted}>
          THE QUEST COLLECTION · PREVIEW
        </Text>
        {categories.map(({ title, detail, icon: Icon, color }) => (
          <View key={title} style={styles.row}>
            <Icon size={22} color={color} />
            <View style={styles.text}>
              <Text>{title}</Text>
              <Text variant="small" style={styles.muted}>
                {detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PlaceholderScreen>
  );
}
