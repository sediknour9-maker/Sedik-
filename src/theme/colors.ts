/**
 * Dark theme modeled after the MCI Personal Training AI look:
 * near-black ground, dark gray cards, white text, strong red accent.
 * "Soft" variants are translucent tints used behind icons and selected states.
 */
export const colors = {
  background: '#0E0F12',
  surface: '#1A1C21',
  surfaceRaised: '#24272E',
  border: '#2A2D34',

  primary: '#E8402A',
  primaryLight: '#FF8A70',
  primarySoft: 'rgba(232, 64, 42, 0.16)',

  secondary: '#2FA97C',
  secondaryLight: '#5FD3A8',
  secondarySoft: 'rgba(47, 169, 124, 0.16)',

  accent: '#F2B84B',
  accentSoft: 'rgba(242, 184, 75, 0.16)',

  info: '#4DA3FF',
  infoSoft: 'rgba(77, 163, 255, 0.16)',

  violet: '#A78BFA',
  violetSoft: 'rgba(167, 139, 250, 0.16)',

  pink: '#F28BB3',
  pinkSoft: 'rgba(242, 139, 179, 0.16)',

  orange: '#FF9A52',
  orangeSoft: 'rgba(255, 154, 82, 0.16)',

  neutralSoft: 'rgba(155, 161, 170, 0.14)',

  text: '#F4F5F7',
  textMuted: '#9BA1AA',
  textDim: '#7D838D',
  onPrimary: '#FFFFFF',

  danger: '#FF5C5C',
  dangerSoft: 'rgba(255, 92, 92, 0.14)',
};

export type Tone = 'primary' | 'secondary' | 'accent' | 'info' | 'violet' | 'pink' | 'orange' | 'neutral' | 'danger';

/** Foreground/background pair for tinted icon badges, chips and tiles. */
export const tones: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: colors.primaryLight, bg: colors.primarySoft },
  secondary: { fg: colors.secondaryLight, bg: colors.secondarySoft },
  accent: { fg: colors.accent, bg: colors.accentSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  violet: { fg: colors.violet, bg: colors.violetSoft },
  pink: { fg: colors.pink, bg: colors.pinkSoft },
  orange: { fg: colors.orange, bg: colors.orangeSoft },
  neutral: { fg: colors.textMuted, bg: colors.neutralSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
};

/**
 * Chart marks. Each chart plots a single series, so each gets one hue; both pass the palette checks
 * (lightness band, chroma, 3:1 contrast) against the dark card surface. Gridlines sit one step off
 * the surface; labels always use text colors, never these.
 */
export const chartColors = {
  weight: '#3B8EF0',
  kcal: colors.primary,
  kcalSelected: colors.primaryLight,
  grid: colors.border,
  reference: colors.textDim,
};

/** Fixed hues for the three macronutrients, used consistently in every chart. */
export const macroColors = {
  protein: colors.secondary,
  carbs: colors.accent,
  fat: colors.violet,
};
