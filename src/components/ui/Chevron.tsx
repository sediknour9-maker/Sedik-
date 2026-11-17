import React from 'react';

import { useRTL } from '../../theme/rtl';
import { colors } from '../../theme/colors';
import { Icon } from './Icon';

interface ChevronProps {
  size?: number;
  color?: string;
}

/** "Go forward" affordance on tappable rows; points along the reading direction. */
export function Chevron({ size = 18, color = colors.textDim }: ChevronProps) {
  const isRTL = useRTL();
  return <Icon name={isRTL ? 'chevronLeft' : 'chevronRight'} size={size} color={color} />;
}
