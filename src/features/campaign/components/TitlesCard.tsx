import { View } from "react-native";
import { Text } from "../../../components/Text";
import { Button } from "../../../components/Button";
import { TITLES } from "../../game/journey/narrative/config";
import { useGame } from "../../game/state/GameProvider";
import { Card, SaveError, campaignStyles } from "./CampaignUI";
export function TitlesCard() {
  const { snapshot, equipTitle, isSaving } = useGame();
  const narrative = snapshot?.journey?.narrative;
  return (
    <Card>
      <Text variant="title">Your Titles</Text>
      <Text variant="small" style={campaignStyles.muted}>
        Earned titles stay with you across your story.
      </Text>
      {TITLES.map((title) => {
        const unlocked = narrative?.titles.find((t) => t.id === title.id);
        const equipped = narrative?.equippedTitleId === title.id;
        return (
          <View key={title.id} style={{ gap: 8 }}>
            <Text
              style={unlocked ? campaignStyles.accent : campaignStyles.muted}
            >
              {title.title} ·{" "}
              {equipped ? "EQUIPPED" : unlocked ? "UNLOCKED" : "LOCKED"}
            </Text>
            <Text variant="small" style={campaignStyles.muted}>
              {title.description}
            </Text>
            {unlocked && (
              <Button
                secondary
                disabled={isSaving}
                label={
                  equipped ? `Unequip ${title.title}` : `Equip ${title.title}`
                }
                onPress={() => void equipTitle(equipped ? null : title.id)}
              />
            )}
          </View>
        );
      })}
      <SaveError />
    </Card>
  );
}
