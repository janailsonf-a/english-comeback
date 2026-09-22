import { Paintbrush, Settings2, UserRound } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Avatar } from "../../components/Illustrations";
import { Text } from "../../components/Text";
import { colors, fonts } from "../../theme/tokens";
import { useGame } from "../game/state/GameProvider";
import { PlaceholderScreen, previewStyles } from "./PlaceholderScreen";

export function ProfileScreen() {
  const { snapshot } = useGame();
  return (
    <PlaceholderScreen
      eyebrow="PROFILE"
      title="The hero is you."
      description="A place for your identity, your preferences, and your next chapter. Personalization is coming later."
      icon={UserRound}
    >
      {snapshot && (
        <View style={[previewStyles.card, styles.player]}>
          <Avatar size={96} />
          <Text variant="title">{snapshot.player.name}</Text>
          <Text variant="small" style={previewStyles.muted}>
            {snapshot.player.title}
          </Text>
          <View style={styles.level}>
            <Text style={styles.levelText}>
              LV. {snapshot.player.level} · {snapshot.world.name}
            </Text>
          </View>
          <Text variant="small" style={previewStyles.muted}>
            Local demo profile · no account required
          </Text>
        </View>
      )}
      <View style={previewStyles.card}>
        {[
          { icon: Paintbrush, title: "Character customization" },
          { icon: Settings2, title: "Study preferences" },
        ].map(({ icon: Icon, title }) => (
          <View key={title} style={previewStyles.row}>
            <Icon size={18} color={colors.muted} />
            <Text style={previewStyles.text}>{title}</Text>
            <Text variant="small" style={previewStyles.muted}>
              Soon
            </Text>
          </View>
        ))}
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  player: { alignItems: "center", gap: 8, paddingVertical: 28 },
  level: {
    marginVertical: 6,
    backgroundColor: colors.accentSoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  levelText: { color: colors.accent, fontFamily: fonts.bold, fontSize: 11 },
});
