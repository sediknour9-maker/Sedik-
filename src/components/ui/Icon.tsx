import React, { type ComponentType } from 'react';

import Activity from 'lucide-react-native/icons/activity';
import Apple from 'lucide-react-native/icons/apple';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ArrowsUpFromLine from 'lucide-react-native/icons/arrows-up-from-line';
import Bike from 'lucide-react-native/icons/bike';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Camera from 'lucide-react-native/icons/camera';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import ChartNoAxesColumnIncreasing from 'lucide-react-native/icons/chart-no-axes-column-increasing';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import Circle from 'lucide-react-native/icons/circle';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Clock from 'lucide-react-native/icons/clock';
import Cookie from 'lucide-react-native/icons/cookie';
import Croissant from 'lucide-react-native/icons/croissant';
import Droplet from 'lucide-react-native/icons/droplet';
import Drumstick from 'lucide-react-native/icons/drumstick';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import Flame from 'lucide-react-native/icons/flame';
import Footprints from 'lucide-react-native/icons/footprints';
import GlassWater from 'lucide-react-native/icons/glass-water';
import Globe from 'lucide-react-native/icons/globe';
import Goal from 'lucide-react-native/icons/goal';
import HandFist from 'lucide-react-native/icons/hand-fist';
import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import House from 'lucide-react-native/icons/house';
import Info from 'lucide-react-native/icons/info';
import Kayak from 'lucide-react-native/icons/kayak';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Minus from 'lucide-react-native/icons/minus';
import Moon from 'lucide-react-native/icons/moon';
import MoonStar from 'lucide-react-native/icons/moon-star';
import MountainSnow from 'lucide-react-native/icons/mountain-snow';
import Music from 'lucide-react-native/icons/music';
import Pause from 'lucide-react-native/icons/pause';
import Pencil from 'lucide-react-native/icons/pencil';
import PersonStanding from 'lucide-react-native/icons/person-standing';
import Play from 'lucide-react-native/icons/play';
import Plus from 'lucide-react-native/icons/plus';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Ruler from 'lucide-react-native/icons/ruler';
import Salad from 'lucide-react-native/icons/salad';
import ScanBarcode from 'lucide-react-native/icons/scan-barcode';
import Search from 'lucide-react-native/icons/search';
import SkipForward from 'lucide-react-native/icons/skip-forward';
import Soup from 'lucide-react-native/icons/soup';
import SportShoe from 'lucide-react-native/icons/sport-shoe';
import Sun from 'lucide-react-native/icons/sun';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Sunset from 'lucide-react-native/icons/sunset';
import Target from 'lucide-react-native/icons/target';
import Timer from 'lucide-react-native/icons/timer';
import Trash2 from 'lucide-react-native/icons/trash-2';
import TrendingDown from 'lucide-react-native/icons/trending-down';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Trophy from 'lucide-react-native/icons/trophy';
import UserRound from 'lucide-react-native/icons/user-round';
import Utensils from 'lucide-react-native/icons/utensils';
import Volleyball from 'lucide-react-native/icons/volleyball';
import WavesLadder from 'lucide-react-native/icons/waves-ladder';
import Weight from 'lucide-react-native/icons/weight';
import Wheat from 'lucide-react-native/icons/wheat';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';

import { colors } from '../../theme/colors';
import { TagineGlyph } from '../brand/TagineGlyph';

type Glyph = ComponentType<{
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  fill?: string;
}>;

// Icons are imported one by one so the bundle only contains the ones in use.
const ICONS = {
  activity: Activity,
  apple: Apple,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  jump: ArrowsUpFromLine,
  bike: Bike,
  calendar: CalendarDays,
  camera: Camera,
  chart: ChartColumn,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  circle: Circle,
  checkCircle: CircleCheck,
  clock: Clock,
  cookie: Cookie,
  croissant: Croissant,
  droplet: Droplet,
  drumstick: Drumstick,
  dumbbell: Dumbbell,
  flame: Flame,
  footprints: Footprints,
  glass: GlassWater,
  globe: Globe,
  goal: Goal,
  fist: HandFist,
  heartPulse: HeartPulse,
  home: House,
  info: Info,
  kayak: Kayak,
  message: MessageCircle,
  minus: Minus,
  moon: Moon,
  moonStar: MoonStar,
  mountain: MountainSnow,
  music: Music,
  pause: Pause,
  pencil: Pencil,
  person: PersonStanding,
  play: Play,
  plus: Plus,
  refresh: RefreshCw,
  ruler: Ruler,
  salad: Salad,
  barcode: ScanBarcode,
  search: Search,
  skip: SkipForward,
  soup: Soup,
  shoe: SportShoe,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  target: Target,
  timer: Timer,
  trash: Trash2,
  trendingDown: TrendingDown,
  trendingUp: TrendingUp,
  trophy: Trophy,
  user: UserRound,
  utensils: Utensils,
  ball: Volleyball,
  stairs: ChartNoAxesColumnIncreasing,
  swim: WavesLadder,
  tagine: TagineGlyph,
  weight: Weight,
  wheat: Wheat,
  close: X,
  zap: Zap,
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Fills the outline, e.g. to show a droplet or flame as "on". */
  fill?: string;
}

export function Icon({ name, size = 20, color = colors.text, strokeWidth = 2, fill = 'none' }: IconProps) {
  const IconComponent: Glyph = ICONS[name];
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} fill={fill} />;
}
