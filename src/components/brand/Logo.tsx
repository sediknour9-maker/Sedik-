import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme/colors';

// Mountain peak that doubles as the "A" of Atlas, drawn on a 48-unit grid.
const MARK_PATH = 'M7 36 L24 10 L41 36 L33 36 L24 22.5 L15 36 Z';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 64 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Atlas Fit">
      <Rect width={48} height={48} rx={12} fill={colors.primary} />
      <Path d={MARK_PATH} fill={colors.onPrimary} />
    </Svg>
  );
}
