import { paletteFor } from '@alcostore/shared'

/**
 * Məhsul fotosu olmayanda göstərilən şüşə illüstrasiyası (kateqoriyaya görə forma və rəng).
 * Real foto admin paneldən yüklənəndə avtomatik əvəz olunur.
 */
export function BottleArt({ category, label, className }: { category: string; label?: string; className?: string }) {
  const p = paletteFor(category)
  const shape = SHAPES[category] ?? SHAPES.default
  const id = `g-${category}`
  return (
    <svg viewBox="0 0 120 200" className={className} role="img" aria-label={label ?? 'Məhsul'}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#241C18" />
          <stop offset="1" stopColor="#14100E" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.glass} />
          <stop offset="0.45" stopColor={p.liquid} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.glass} />
        </linearGradient>
      </defs>
      <rect width="120" height="200" fill={`url(#${id}-bg)`} />
      <ellipse cx="60" cy="186" rx="34" ry="5" fill="#000" opacity="0.45" />
      <path d={shape.body} fill={`url(#${id}-glass)`} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      <rect x={shape.cap.x} y={shape.cap.y} width={shape.cap.w} height={shape.cap.h} rx="2" fill={p.cap} />
      <rect x={shape.label.x} y={shape.label.y} width={shape.label.w} height={shape.label.h} rx="2" fill={p.label} opacity="0.92" />
      <rect x={shape.label.x + 6} y={shape.label.y + shape.label.h / 2 - 5} width={shape.label.w - 12} height="3" rx="1.5" fill={p.glass} opacity="0.7" />
      <rect x={shape.label.x + 10} y={shape.label.y + shape.label.h / 2 + 2} width={shape.label.w - 20} height="2" rx="1" fill={p.glass} opacity="0.45" />
      <path d={shape.shine} fill="rgba(255,255,255,0.10)" />
    </svg>
  )
}

interface Shape {
  body: string
  cap: { x: number; y: number; w: number; h: number }
  label: { x: number; y: number; w: number; h: number }
  shine: string
}

const SHAPES: Record<string, Shape> = {
  // Uzun boğazlı şərab şüşəsi
  serab: {
    body: 'M53 20h14v40c0 8 13 14 13 30v88c0 3-2 5-5 5H45c-3 0-5-2-5-5V90c0-16 13-22 13-30z',
    cap: { x: 52, y: 14, w: 16, h: 14 },
    label: { x: 43, y: 110, w: 34, h: 40 },
    shine: 'M46 96h4v80h-4z',
  },
  sampan: {
    body: 'M54 24h12v36c0 10 15 16 15 32v86c0 3-2 5-5 5H44c-3 0-5-2-5-5V92c0-16 15-22 15-32z',
    cap: { x: 51, y: 12, w: 18, h: 20 },
    label: { x: 42, y: 108, w: 36, h: 38 },
    shine: 'M45 98h4v78h-4z',
  },
  // Kvadrat çiyinli viski
  viski: {
    body: 'M52 30h16v22l14 10v116c0 3-2 5-5 5H43c-3 0-5-2-5-5V62l14-10z',
    cap: { x: 50, y: 20, w: 20, h: 14 },
    label: { x: 42, y: 96, w: 36, h: 46 },
    shine: 'M42 70h4v104h-4z',
  },
  konyak: {
    body: 'M54 30h12v24c0 6 20 14 20 40v84c0 3-2 5-5 5H39c-3 0-5-2-5-5V94c0-26 20-34 20-40z',
    cap: { x: 51, y: 18, w: 18, h: 16 },
    label: { x: 40, y: 108, w: 40, h: 36 },
    shine: 'M40 100h4v76h-4z',
  },
  araq: {
    body: 'M54 18h12v34c0 6 12 10 12 22v104c0 3-2 5-5 5H47c-3 0-5-2-5-5V74c0-12 12-16 12-22z',
    cap: { x: 52, y: 10, w: 16, h: 14 },
    label: { x: 45, y: 100, w: 30, h: 50 },
    shine: 'M47 80h4v96h-4z',
  },
  // Qısa pivə şüşəsi
  pive: {
    body: 'M55 40h10v24c0 6 12 10 12 22v92c0 3-2 5-5 5H48c-3 0-5-2-5-5V86c0-12 12-16 12-22z',
    cap: { x: 53, y: 34, w: 14, h: 8 },
    label: { x: 45, y: 118, w: 30, h: 34 },
    shine: 'M48 92h3v84h-3z',
  },
  default: {
    body: 'M52 30h16v22l14 10v116c0 3-2 5-5 5H43c-3 0-5-2-5-5V62l14-10z',
    cap: { x: 50, y: 20, w: 20, h: 14 },
    label: { x: 42, y: 96, w: 36, h: 46 },
    shine: 'M42 70h4v104h-4z',
  },
}
