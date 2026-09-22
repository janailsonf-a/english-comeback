import { Tabs } from "expo-router";
import {
  ChartNoAxesCombined,
  House,
  Map,
  ScrollText,
  UserRound,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../../theme/tokens";

const routes = [
  { name: "index", title: "Home", icon: House },
  { name: "quests", title: "Quests", icon: ScrollText },
  { name: "journey", title: "Journey", icon: Map },
  { name: "progress", title: "Progress", icon: ChartNoAxesCombined },
  { name: "profile", title: "Profile", icon: UserRound },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: {
          backgroundColor: "#10151B",
          borderTopColor: colors.border,
          height: 80 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 10,
          lineHeight: 14,
          marginTop: 3,
        },
        sceneStyle: { backgroundColor: colors.background },
        animation: "none",
      }}
    >
      {routes.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.icon, focused && styles.focused]}>
                <Icon color={color} size={20} strokeWidth={focused ? 2 : 1.6} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 44,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  focused: { backgroundColor: colors.accentSoft },
});
