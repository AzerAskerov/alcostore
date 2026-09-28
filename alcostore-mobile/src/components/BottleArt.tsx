import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import { paletteFor } from '@alcostore/shared'

/** Foto olmayanda kateqoriyaya görə şüşə illüstrasiyası (veb versiyası ilə eyni formalar). */
const SHAPES: Record<string, { body: string; cap: number[]; label: number[]; shine: string }> = {
  serab: { body: 'M53 20h14v40c0 8 13 14 13 30v88c0 3-2 5-5 5H45c-3 0-5-2-5-5V90c0-16 13-22 13-30z', cap: [52, 14, 16, 14], label: [43, 110, 34, 40], shine: 'M46 96h4v80h-4z' },
  sampan: { body: 'M54 24h12v36c0 10 15 16 15 32v86c0 3-2 5-5 5H44c-3 0-5-2-5-5V92c0-16 15-22 15-32z', cap: [51, 12, 18, 20], label: [42, 108, 36, 38], shine: 'M45 98h4v78h-4z' },
  viski: { body: 'M52 30h16v22l14 10v116c0 3-2 5-5 5H43c-3 0-5-2-5-5V62l14-10z', cap: [50, 20, 20, 14], label: [42, 96, 36, 46], shine: 'M42 70h4v104h-4z' },
  konyak: { body: 'M54 30h12v24c0 6 20 14 20 40v84c0 3-2 5-5 5H39c-3 0-5-2-5-5V94c0-26 20-34 20-40z', cap: [51, 18, 18, 16], label: [40, 108, 40, 36], shine: 'M40 100h4v76h-4z' },
  araq: { body: 'M54 18h12v34c0 6 12 10 12 22v104c0 3-2 5-5 5H47c-3 0-5-2-5-5V74c0-12 12-16 12-22z', cap: [52, 10, 16, 14], label: [45, 100, 30, 50], shine: 'M47 80h4v96h-4z' },
  pive: { body: 'M55 40h10v24c0 6 12 10 12 22v92c0 3-2 5-5 5H48c-3 0-5-2-5-5V86c0-12 12-16 12-22z', cap: [53, 34, 14, 8], label: [45, 118, 30, 34], shine: 'M48 92h3v84h-3z' },
}

export function BottleArt({ category, width, height }: { category: string; width: number | `${number}%`; height: number | `${number}%` }) {
  const p = paletteFor(category)
  const sh = SHAPES[category] ?? SHAPES.viski
  const id = `b-${category}`
  const [lx, ly, lw, lh] = sh.label
  const [cx, cy, cw, ch] = sh.cap
  return (
    <Svg width={width} height={height} viewBox="0 0 120 200" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={p.glass} />
          <Stop offset="0.45" stopColor={p.liquid} stopOpacity="0.9" />
          <Stop offset="1" stopColor={p.glass} />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="186" rx="34" ry="5" fill="#000" opacity={0.45} />
      <Path d={sh.body} fill={`url(#${id}-g)`} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
      <Rect x={cx} y={cy} width={cw} height={ch} rx={2} fill={p.cap} />
      <Rect x={lx} y={ly} width={lw} height={lh} rx={2} fill={p.label} opacity={0.92} />
      <Rect x={lx + 6} y={ly + lh / 2 - 5} width={lw - 12} height={3} rx={1.5} fill={p.glass} opacity={0.7} />
      <Rect x={lx + 10} y={ly + lh / 2 + 2} width={lw - 20} height={2} rx={1} fill={p.glass} opacity={0.45} />
      <Path d={sh.shine} fill="rgba(255,255,255,0.10)" />
    </Svg>
  )
}
