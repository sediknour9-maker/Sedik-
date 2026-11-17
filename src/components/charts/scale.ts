/** Rounds a raw tick step up to 1, 2, 2.5 or 5 times a power of ten. */
export function niceStep(rawStep: number): number {
  if (!(rawStep > 0) || !Number.isFinite(rawStep)) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const fraction = rawStep / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

export interface NiceScale {
  min: number;
  max: number;
  ticks: number[];
}

/**
 * A rounded axis domain that covers [min, max] in about `intervals` clean steps. `minSpan` keeps
 * nearly flat data (a weight that moved 0.2 kg) from being stretched into a dramatic-looking curve.
 */
export function niceScale(min: number, max: number, intervals = 3, minSpan = 0): NiceScale {
  let low = Math.min(min, max);
  let high = Math.max(min, max);
  if (high - low < minSpan) {
    const middle = (low + high) / 2;
    low = middle - minSpan / 2;
    high = middle + minSpan / 2;
  }
  if (high === low) high = low + 1;

  const step = niceStep((high - low) / Math.max(1, intervals));
  const niceMin = Math.floor(low / step) * step;
  const niceMax = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return { min: niceMin, max: niceMax, ticks };
}

/**
 * Axis for values measured from zero (columns). Ticks are clean steps up to the data maximum; the
 * domain only rounds up to the next tick when that wastes little space, so tall columns keep their height.
 */
export function zeroBasedScale(max: number, intervals = 3): NiceScale {
  if (!(max > 0) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0] };
  const step = niceStep(max / Math.max(1, intervals));
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 1e-9; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  const nextTick = Math.round((ticks[ticks.length - 1] + step) * 1000) / 1000;
  if (ticks[ticks.length - 1] < max && nextTick - max <= step * 0.3) {
    ticks.push(nextTick);
    return { min: 0, max: nextTick, ticks };
  }
  return { min: 0, max: Math.max(max, ticks[ticks.length - 1]), ticks };
}

/** Index of the position closest to `x`. */
export function nearestIndex(positions: number[], x: number): number {
  let best = 0;
  let bestDistance = Infinity;
  positions.forEach((position, index) => {
    const distance = Math.abs(position - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

/** SVG path for a column with rounded top corners and a square base, growing up from `baseY`. */
export function columnPath(x: number, width: number, topY: number, baseY: number, radius = 4): string {
  const height = baseY - topY;
  if (height <= 0 || width <= 0) return '';
  const r = Math.min(radius, height, width / 2);
  return [
    `M${x},${baseY}`,
    `L${x},${topY + r}`,
    `Q${x},${topY} ${x + r},${topY}`,
    `L${x + width - r},${topY}`,
    `Q${x + width},${topY} ${x + width},${topY + r}`,
    `L${x + width},${baseY}`,
    'Z',
  ].join(' ');
}
