import {
  BookOpen,
  Headphones,
  Languages,
  Mic,
  ScrollText,
} from "lucide-react-native";
import { colors } from "../../../theme/tokens";
import type { QuestCategory } from "../../game/types";

export const questPresentation = {
  Listening: {
    icon: Headphones,
    color: colors.blue,
    background: colors.blueSoft,
  },
  Speaking: { icon: Mic, color: colors.violet, background: colors.violetSoft },
  Study: {
    icon: ScrollText,
    color: colors.amber,
    background: colors.amberSoft,
  },
  Reading: { icon: BookOpen, color: colors.blue, background: colors.blueSoft },
  Writing: {
    icon: ScrollText,
    color: colors.amber,
    background: colors.amberSoft,
  },
  Grammar: { icon: BookOpen, color: colors.blue, background: colors.blueSoft },
  Vocabulary: {
    icon: Languages,
    color: colors.accent,
    background: colors.accentSoft,
  },
} satisfies Record<
  QuestCategory,
  { icon: typeof Headphones; color: string; background: string }
>;
