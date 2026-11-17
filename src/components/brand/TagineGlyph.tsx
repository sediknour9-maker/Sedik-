import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface GlyphProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

/** Tagine pot in the same 24px stroke style as the rest of the icon set. */
export function TagineGlyph({ size = 24, color = 'currentColor', strokeWidth = 2 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2.5 16.5h19" />
      <Path d="M5 16.5c0 2 1.6 3.5 3.6 3.5h6.8c2 0 3.6-1.5 3.6-3.5" />
      <Path d="M5.5 16.5C6.5 11.5 9 7.5 12 6.5c3 1 5.5 5 6.5 10" />
      <Path d="M12 6.5V4" />
      <Circle cx={12} cy={3.3} r={0.9} fill={color} />
    </Svg>
  );
}
