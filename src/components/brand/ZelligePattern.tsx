import React, { useId, useMemo } from 'react';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '../../theme/colors';

const TILE = 50;
const STAR_RADIUS = 19;
// Where the sides of the two overlapping squares of an eight-pointed star cross.
const INNER_RATIO = 0.7654;
const DIAMOND_RADIUS = 6.5;

function starPath(cx: number, cy: number): string {
  let path = '';
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    const pointRadius = i % 2 === 0 ? STAR_RADIUS : STAR_RADIUS * INNER_RATIO;
    const x = (cx + pointRadius * Math.cos(angle)).toFixed(1);
    const y = (cy + pointRadius * Math.sin(angle)).toFixed(1);
    path += `${i === 0 ? 'M' : 'L'}${x} ${y}`;
  }
  return `${path}Z`;
}

function diamondPath(cx: number, cy: number): string {
  const r = DIAMOND_RADIUS;
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

interface ZelligePatternProps {
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  /** Background color the pattern dissolves into toward its bottom edge. */
  fadeTo?: string;
}

/** Outline tiling of eight-pointed stars, after Moroccan zellige tilework. */
export function ZelligePattern({
  width,
  height,
  color = colors.primary,
  opacity = 0.4,
  fadeTo,
}: ZelligePatternProps) {
  const gradientId = `zellige${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const tiling = useMemo(() => {
    let path = '';
    for (let y = TILE / 2; y < height + TILE; y += TILE) {
      for (let x = TILE / 2; x < width + TILE; x += TILE) {
        path += starPath(x, y) + diamondPath(x + TILE / 2, y + TILE / 2);
      }
    }
    return path;
  }, [width, height]);

  return (
    <Svg width={width} height={height}>
      <Path d={tiling} fill="none" stroke={color} strokeWidth={1.2} opacity={opacity} />
      {fadeTo ? (
        <>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.25" stopColor={fadeTo} stopOpacity={0} />
              <Stop offset="1" stopColor={fadeTo} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={height} fill={`url(#${gradientId})`} />
        </>
      ) : null}
    </Svg>
  );
}
