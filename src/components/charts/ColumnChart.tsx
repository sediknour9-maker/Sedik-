import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { chartColors, colors } from '../../theme/colors';
import { useRTL } from '../../theme/rtl';
import { Txt } from '../ui/Txt';
import { columnPath, nearestIndex, zeroBasedScale } from './scale';

export interface ColumnDatum {
  key: string;
  /** Short axis label under the column (e.g. a weekday letter). */
  label: string;
  value: number;
}

interface ColumnChartProps {
  /** In reading order (oldest first for time). */
  data: ColumnDatum[];
  color?: string;
  selectedColor?: string;
  /** Optional reference value drawn as a solid line across the plot. */
  reference?: number;
  /** Key selected initially and whenever the data changes (defaults to the last column). */
  defaultKey?: string;
  formatTick: (value: number) => string;
  renderReadout: (datum: ColumnDatum) => ReactNode;
  plotHeight?: number;
  accessibilityLabel: string;
  testID?: string;
}

const AXIS_GUTTER = 40;
const PAD_TOP = 10;
const X_AXIS_BAND = 24;
const MAX_COLUMN_WIDTH = 24;

/** Columns from a zero baseline with an optional reference line; tap, drag or hover selects a column. */
export function ColumnChart({
  data,
  color = chartColors.kcal,
  selectedColor = chartColors.kcalSelected,
  reference,
  defaultKey,
  formatTick,
  renderReadout,
  plotHeight = 140,
  accessibilityLabel,
  testID,
}: ColumnChartProps) {
  const isRTL = useRTL();
  const [width, setWidth] = useState(0);
  const initialIndex = Math.max(0, defaultKey ? data.findIndex((d) => d.key === defaultKey) : data.length - 1);
  const [selected, setSelected] = useState(initialIndex);
  const dataSignature = data.map((d) => `${d.key}:${d.value}`).join('|');

  useEffect(() => setSelected(initialIndex), [dataSignature, initialIndex]);

  const maxValue = Math.max(0, ...data.map((d) => d.value), reference ?? 0);
  const scale = useMemo(() => zeroBasedScale(maxValue, 3), [maxValue]);

  const plotLeft = isRTL ? 0 : AXIS_GUTTER;
  const plotRight = Math.max(plotLeft + 1, width - (isRTL ? AXIS_GUTTER : 0));
  const plotWidth = plotRight - plotLeft;
  const baseY = plotHeight - 1;
  const band = plotWidth / Math.max(1, data.length);
  const columnWidth = Math.min(MAX_COLUMN_WIDTH, band * 0.6);

  const yOf = (value: number) => PAD_TOP + (1 - value / scale.max) * (baseY - PAD_TOP);
  const centerOf = (index: number) => (isRTL ? plotRight - band * (index + 0.5) : plotLeft + band * (index + 0.5));
  const centers = data.map((_, index) => centerOf(index));
  const active = Math.min(selected, data.length - 1);

  const selectAt = (x: number) => setSelected(nearestIndex(centers, x));

  const webHover =
    Platform.OS === 'web'
      ? {
          onPointerMove: (event: { nativeEvent: { clientX: number }; currentTarget: unknown }) => {
            const rect = (event.currentTarget as { getBoundingClientRect?: () => { left: number } })
              .getBoundingClientRect?.();
            if (rect) selectAt(event.nativeEvent.clientX - rect.left);
          },
          onPointerLeave: () => setSelected(initialIndex),
        }
      : {};

  return (
    <View style={{ gap: 12 }} testID={testID}>
      {data.length ? renderReadout(data[active]) : null}

      <View
        style={{ height: plotHeight + X_AXIS_BAND }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={accessibilityLabel}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => selectAt(event.nativeEvent.locationX)}
        onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
        onResponderTerminationRequest={() => true}
        {...(webHover as object)}
      >
        {width > 0 ? (
          <>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg width={width} height={plotHeight}>
                {scale.ticks.map((tick) => (
                  <Line
                    key={tick}
                    x1={plotLeft}
                    x2={plotRight}
                    y1={yOf(tick)}
                    y2={yOf(tick)}
                    stroke={chartColors.grid}
                    strokeWidth={1}
                  />
                ))}
                {data.map((datum, index) => (
                  <Path
                    key={datum.key}
                    d={columnPath(centers[index] - columnWidth / 2, columnWidth, yOf(datum.value), baseY)}
                    fill={index === active ? selectedColor : color}
                  />
                ))}
                {reference ? (
                  <Line
                    x1={plotLeft}
                    x2={plotRight}
                    y1={yOf(reference)}
                    y2={yOf(reference)}
                    stroke={chartColors.reference}
                    strokeWidth={1.5}
                  />
                ) : null}
              </Svg>
            </View>

            {scale.ticks.map((tick) => (
              <Txt
                key={tick}
                variant="micro"
                tabular
                color={colors.textDim}
                style={[
                  styles.tick,
                  { top: yOf(tick) - 8 },
                  isRTL ? { right: 0, textAlign: 'right' } : { left: 0, textAlign: 'left' },
                ]}
                pointerEvents="none"
              >
                {formatTick(tick)}
              </Txt>
            ))}

            {data.map((datum, index) => (
              <Txt
                key={datum.key}
                variant="micro"
                center
                color={index === active ? colors.text : colors.textDim}
                style={[
                  styles.columnLabel,
                  { top: plotHeight + 6, left: centers[index] - band / 2, width: band },
                  index === active && styles.columnLabelActive,
                ]}
                pointerEvents="none"
              >
                {datum.label}
              </Txt>
            ))}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', width: AXIS_GUTTER - 8 },
  columnLabel: { position: 'absolute' },
  columnLabelActive: { fontWeight: '800' },
});
