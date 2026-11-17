import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { daysBetween } from '../../services/date';
import { chartColors, colors } from '../../theme/colors';
import { useRTL } from '../../theme/rtl';
import { Txt } from '../ui/Txt';
import { nearestIndex, niceScale } from './scale';

export interface TrendPoint {
  date: string;
  value: number;
}

interface TrendLineChartProps {
  /** Oldest first; at least one point. */
  points: TrendPoint[];
  color?: string;
  /** Axis tick text. */
  formatTick: (value: number) => string;
  /** Short date for the time axis ends. */
  formatAxisDate: (date: string) => string;
  /** The readout above the plot for the selected point (defaults to the latest). */
  renderReadout: (point: TrendPoint, index: number) => ReactNode;
  /** Smallest value range the axis shows, so tiny changes are not exaggerated. */
  minSpan?: number;
  plotHeight?: number;
  accessibilityLabel: string;
  testID?: string;
}

const AXIS_GUTTER = 36;
const EDGE = 8;
const PAD_TOP = 10;
const X_AXIS_BAND = 24;
const DOT_RADIUS = 4;
const RING = 2;
/** Markers on every point only while they stay readable. */
const MAX_MARKED_POINTS = 14;

/** Line chart over calendar time with a tap/drag (and hover on web) crosshair readout. */
export function TrendLineChart({
  points,
  color = chartColors.weight,
  formatTick,
  formatAxisDate,
  renderReadout,
  minSpan = 0,
  plotHeight = 150,
  accessibilityLabel,
  testID,
}: TrendLineChartProps) {
  const isRTL = useRTL();
  const [width, setWidth] = useState(0);
  const lastIndex = points.length - 1;
  const [selected, setSelected] = useState(lastIndex);

  // New data (a freshly logged weight) jumps the readout back to the latest point.
  useEffect(() => setSelected(lastIndex), [lastIndex, points[lastIndex]?.value]);

  const values = points.map((point) => point.value);
  const scale = useMemo(
    () => niceScale(Math.min(...values), Math.max(...values), 3, minSpan),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values.join('|'), minSpan]
  );

  const plotLeft = isRTL ? EDGE : AXIS_GUTTER;
  const plotRight = Math.max(plotLeft + 1, width - (isRTL ? AXIS_GUTTER : EDGE));
  const plotWidth = plotRight - plotLeft;
  const plotBottom = plotHeight - 1;
  const first = points[0];
  const span = Math.max(1, daysBetween(first.date, points[lastIndex].date));

  // Time runs right-to-left in RTL, like every other row in the app.
  const xOf = (date: string) => {
    const t = points.length === 1 ? 0.5 : daysBetween(first.date, date) / span;
    return isRTL ? plotRight - t * plotWidth : plotLeft + t * plotWidth;
  };
  const yOf = (value: number) =>
    PAD_TOP + (1 - (value - scale.min) / (scale.max - scale.min)) * (plotBottom - PAD_TOP);

  const positions = points.map((point) => ({ x: xOf(point.date), y: yOf(point.value) }));
  const linePath = positions.map((p, index) => `${index === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath =
    positions.length > 1
      ? `${linePath} L${positions[lastIndex].x},${plotBottom} L${positions[0].x},${plotBottom} Z`
      : '';
  const active = positions[Math.min(selected, lastIndex)];

  const selectAt = (x: number) => setSelected(nearestIndex(positions.map((p) => p.x), x));

  const webHover =
    Platform.OS === 'web'
      ? {
          onPointerMove: (event: { nativeEvent: { clientX: number }; currentTarget: unknown }) => {
            const rect = (event.currentTarget as { getBoundingClientRect?: () => { left: number } })
              .getBoundingClientRect?.();
            if (rect) selectAt(event.nativeEvent.clientX - rect.left);
          },
          onPointerLeave: () => setSelected(lastIndex),
        }
      : {};

  return (
    <View style={{ gap: 12 }} testID={testID}>
      {renderReadout(points[Math.min(selected, lastIndex)], Math.min(selected, lastIndex))}

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
                {areaPath ? <Path d={areaPath} fill={color} fillOpacity={0.1} /> : null}
                {positions.length > 1 ? (
                  <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                ) : null}
                {active ? (
                  <Line
                    x1={active.x}
                    x2={active.x}
                    y1={PAD_TOP - 6}
                    y2={plotBottom}
                    stroke={chartColors.reference}
                    strokeWidth={1}
                  />
                ) : null}
                {positions.map((p, index) => {
                  const isActive = index === Math.min(selected, lastIndex);
                  const marked = isActive || index === lastIndex || points.length <= MAX_MARKED_POINTS;
                  if (!marked) return null;
                  return (
                    <React.Fragment key={points[index].date}>
                      <Circle cx={p.x} cy={p.y} r={DOT_RADIUS + RING} fill={colors.surface} />
                      <Circle cx={p.x} cy={p.y} r={isActive ? DOT_RADIUS + 1 : DOT_RADIUS} fill={color} />
                    </React.Fragment>
                  );
                })}
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

            <View pointerEvents="none" style={[styles.xAxis, { top: plotHeight + 6, left: plotLeft, width: plotWidth }]}>
              {points.length === 1 ? (
                <Txt variant="micro" center color={colors.textDim}>
                  {formatAxisDate(first.date)}
                </Txt>
              ) : (
                <>
                  <Txt variant="micro" color={colors.textDim} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: 0 }}>
                    {formatAxisDate(first.date)}
                  </Txt>
                  <Txt variant="micro" color={colors.textDim} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: 0 }}>
                    {formatAxisDate(points[lastIndex].date)}
                  </Txt>
                </>
              )}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', width: AXIS_GUTTER - 6 },
  xAxis: { position: 'absolute', height: 16 },
});
