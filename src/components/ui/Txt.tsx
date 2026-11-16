import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors } from '../../theme/colors';
import { useRTL } from '../../theme/rtl';

const VARIANTS = {
  display: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 34 },
  heading: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  subheading: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 17 },
  micro: { fontSize: 11, fontWeight: '500', lineHeight: 15 },
} satisfies Record<string, TextStyle>;

export type TxtVariant = keyof typeof VARIANTS;

interface TxtProps extends TextProps {
  variant?: TxtVariant;
  color?: string;
  /** Centers the text instead of following the reading direction. */
  center?: boolean;
  /** Fixed-width digits so changing numbers don't shift their surroundings. */
  tabular?: boolean;
}

/** Text that follows the active language's reading direction by default. */
export function Txt({ variant = 'body', color = colors.text, center, tabular, style, ...rest }: TxtProps) {
  const isRTL = useRTL();

  return (
    <Text
      {...rest}
      style={[
        VARIANTS[variant],
        {
          color,
          textAlign: center ? 'center' : isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
