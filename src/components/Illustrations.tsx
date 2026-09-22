import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";
import { View } from "react-native";

// Original, code-native artwork: no remote assets or image generation required.
export function Avatar({ size = 64 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Adventurer portrait"
    >
      <Defs>
        <LinearGradient id="avatar-bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#465642" />
          <Stop offset="1" stopColor="#1A2420" />
        </LinearGradient>
      </Defs>
      <Circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#avatar-bg)"
        stroke="#738C55"
        strokeWidth="1.5"
      />
      <Circle
        cx="50"
        cy="50"
        r="39"
        fill="none"
        stroke="#C7F36B"
        strokeOpacity="0.16"
        strokeDasharray="2 6"
      />
      <Path d="M19 86 Q20 61 35 60 L65 60 Q80 61 81 86" fill="#50624C" />
      <Path
        d="M28 61 L27 40 Q28 15 50 14 Q72 15 73 40 L72 61 L60 70 L40 70 Z"
        fill="#23362B"
      />
      <Path
        d="M34 39 Q34 23 50 24 Q66 23 66 39 L64 53 Q58 66 50 66 Q42 66 36 53 Z"
        fill="#C99A76"
      />
      <Path
        d="M32 39 Q31 19 52 21 Q71 21 68 40 L58 32 L48 35 L39 32 Z"
        fill="#161C1B"
      />
      <Path
        d="M40 47 L45 47 M55 47 L60 47"
        stroke="#352A26"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M44 57 Q50 60 56 57"
        fill="none"
        stroke="#80583F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M35 66 L50 79 L65 66 L71 87 L29 87 Z" fill="#344735" />
      <Path d="M46 77 L50 73 L54 77 L50 85 Z" fill="#C7F36B" />
    </Svg>
  );
}

export function WorldLandscape() {
  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants">
      <Svg width={100} height={68} viewBox="0 0 140 90">
        <Circle cx="110" cy="22" r="13" fill="#C7F36B" fillOpacity="0.1" />
        <Circle cx="110" cy="22" r="8" fill="#C7F36B" fillOpacity="0.25" />
        <Path d="M0 74 L35 20 L61 53 L83 30 L140 77 Z" fill="#344337" />
        <Path d="M10 74 L52 34 L87 77 Z" fill="#536647" />
        <Path d="M35 20 L23 40 L35 36 L42 40 Z" fill="#8BA276" />
        <Path d="M83 30 L73 45 L83 42 L90 46 Z" fill="#647D53" />
        <Path d="M0 80 Q35 63 67 78 T140 78 L140 90 L0 90 Z" fill="#1F3226" />
        <Path
          d="M64 90 Q54 81 70 77 Q81 72 78 66"
          fill="none"
          stroke="#C7F36B"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        <Path
          d="M12 81 L12 48 M3 67 L12 52 L21 67 Z M0 76 L12 59 L24 76 Z"
          stroke="#658653"
          fill="#344D31"
        />
        <Path
          d="M117 86 L117 56 M108 74 L117 59 L126 74 Z M106 83 L117 67 L128 83 Z"
          stroke="#658653"
          fill="#344D31"
        />
      </Svg>
    </View>
  );
}

export function BossPortrait({ size = 120 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      accessibilityLabel="The Silence, a mysterious hooded figure"
    >
      <Defs>
        <LinearGradient id="boss-aura" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9282CB" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#9282CB" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Circle cx="80" cy="77" r="67" fill="url(#boss-aura)" />
      <Circle
        cx="80"
        cy="77"
        r="57"
        fill="none"
        stroke="#9787C6"
        strokeOpacity="0.18"
        strokeDasharray="3 7"
      />
      <Ellipse
        cx="80"
        cy="143"
        rx="53"
        ry="9"
        fill="#080B11"
        fillOpacity="0.7"
      />
      <Path
        d="M27 140 L38 86 Q39 43 80 19 Q121 43 122 86 L133 140 Z"
        fill="#3B3554"
        stroke="#807098"
        strokeWidth="1"
      />
      <Path d="M38 136 L54 78 L80 32 L106 78 L122 136 Z" fill="#242239" />
      <Path
        d="M54 78 Q54 52 80 39 Q106 52 106 78 L99 100 L80 115 L61 100 Z"
        fill="#0B0E17"
      />
      <Path
        d="M61 73 L74 77 M86 77 L99 73"
        stroke="#BAAAFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M61 73 L74 77 M86 77 L99 73"
        stroke="#BAAAFF"
        strokeWidth="8"
        strokeOpacity="0.13"
        strokeLinecap="round"
      />
      <Path
        d="M45 101 L64 123 L58 143 M115 101 L96 123 L102 143"
        fill="none"
        stroke="#645778"
        strokeWidth="1.5"
      />
      <Polygon points="80,112 86,122 80,133 74,122" fill="#81729F" />
      <Rect x="73" y="87" width="14" height="2" rx="1" fill="#45405C" />
    </Svg>
  );
}
