import {
  AudioLines,
  BookOpen,
  ChartNoAxesCombined,
  Headphones,
  Mic,
  TrendingUp,
} from "lucide-react-native";
import { View } from "react-native";
import { Text } from "../../components/Text";
import { colors } from "../../theme/tokens";
import {
  PlaceholderScreen,
  previewStyles as styles,
} from "./PlaceholderScreen";

const skills = [
  { name: "Speaking", icon: Mic },
  { name: "Listening", icon: Headphones },
  { name: "Vocabulary", icon: AudioLines },
  { name: "Grammar", icon: BookOpen },
];

export function ProgressScreen() {
  return (
    <PlaceholderScreen
      eyebrow="PROGRESS"
      title="Effort today. Growth over time."
      description="XP tracks how you show up. Future skill assessments will track your English development separately."
      icon={ChartNoAxesCombined}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <TrendingUp size={22} color={colors.accent} />
          <View style={styles.text}>
            <Text variant="title">Engagement</Text>
            <Text variant="small" style={styles.muted}>
              Quests, XP, and levels reward study effort.
            </Text>
          </View>
        </View>
        <Text variant="small" style={styles.muted}>
          A higher character level does not imply a higher English proficiency
          level.
        </Text>
      </View>
      <View style={styles.card}>
        <Text variant="label" style={styles.muted}>
          LANGUAGE SKILLS · FUTURE ASSESSMENTS
        </Text>
        {skills.map(({ name, icon: Icon }) => (
          <View key={name} style={styles.row}>
            <Icon size={18} color={colors.violet} />
            <Text style={styles.text}>{name}</Text>
            <Text variant="small" style={styles.muted}>
              Not assessed
            </Text>
          </View>
        ))}
      </View>
    </PlaceholderScreen>
  );
}
