import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useRTL } from '../../theme/rtl';

interface RowProps extends ViewProps {
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
}

/** Horizontal layout that mirrors itself in right-to-left languages. */
export function Row({ gap, align = 'center', justify, wrap, style, ...rest }: RowProps) {
  const isRTL = useRTL();

  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    />
  );
}
