import React, { useEffect, useRef, type ReactNode } from 'react';
import { Platform, ScrollView } from 'react-native';

import { rowDirection, useRTL } from '../../theme/rtl';

interface ChipScrollerProps {
  children: ReactNode;
  gap?: number;
}

/**
 * A single horizontally scrolling line of chips. In RTL the line starts at the right edge, and on web a
 * vertical mouse wheel scrolls it sideways so it stays usable without a trackpad.
 */
export function ChipScroller({ children, gap = 8 }: ChipScrollerProps) {
  const isRTL = useRTL();
  const ref = useRef<ScrollView>(null);
  const alignedRef = useRef(false);

  useEffect(() => {
    alignedRef.current = false;
  }, [isRTL]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = (ref.current as unknown as { getScrollableNode?: () => HTMLElement | null })?.getScrollableNode?.();
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const maxScroll = node.scrollWidth - node.clientWidth;
      if (maxScroll <= 0) return;
      const next = Math.min(maxScroll, Math.max(0, node.scrollLeft + (isRTL ? -event.deltaY : event.deltaY)));
      if (next === node.scrollLeft) return;
      event.preventDefault();
      node.scrollLeft = next;
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [isRTL]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexDirection: rowDirection(isRTL), gap }}
      onContentSizeChange={() => {
        // Row-reverse content starts at the far end of the scroll range, so jump there once in RTL.
        if (isRTL && !alignedRef.current) {
          alignedRef.current = true;
          ref.current?.scrollToEnd({ animated: false });
        }
      }}
    >
      {children}
    </ScrollView>
  );
}
