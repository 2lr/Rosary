import type { Bloom } from '@/lib/rosary/growth';

export type BeadState = 'todo' | 'done' | 'active';
export type LoopBead = { kind: 'pater' | 'ave'; state: BeadState };

export type RosaryArtProps = {
  bloom: Bloom;
  /** 55 beads: five decades of one Our Father plus ten Hail Marys. */
  beads?: LoopBead[];
  /** State of the beads hanging under the medal, from the top down. */
  pendant?: BeadState[];
  /** Fraction of the loop lit when no explicit bead states are given. */
  fill?: number;
  className?: string;
  /** Called with the index of a loop bead when it is tapped. */
  onBeadClick?: (index: number) => void;
  title?: string;
};

const W = 400;
const H = 600;
const CX = 200;
const CY = 192;
const R = 146;
const GAP_DEG = 16;
const LOOP_BEADS = 55;
const STEP_DEG = (360 - GAP_DEG) / LOOP_BEADS;

const MEDAL = { x: CX, y: CY + R + 20 };
const PENDANT_Y = [388, 415, 437, 459, 490];

/** Mulberry32 — small, fast, and identical on the server and the client. */
function rng(seed: number) {
  let a = Math.floor(seed * 4294967295) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * radius, y: CY + Math.sin(rad) * radius };
}

/** Angle of loop bead `i`, laid out clockwise from the medal. */
function beadAngle(i: number): number {
  return 90 + GAP_DEG / 2 + STEP_DEG * (i + 0.5);
}

function defaultBeads(): LoopBead[] {
  return Array.from({ length: LOOP_BEADS }, (_, i) => ({
    kind: i % 11 === 0 ? ('pater' as const) : ('ave' as const),
    state: 'todo' as BeadState,
  }));
}

export default function RosaryArt({
  bloom,
  beads,
  pendant,
  fill = 0,
  className,
  onBeadClick,
  title,
}: RosaryArtProps) {
  const { palette } = bloom;
  const random = rng(bloom.seed);

  const loop: LoopBead[] = beads ?? defaultBeads();
  const litUntil = beads ? -1 : Math.round(fill * LOOP_BEADS);
  const pendantStates = pendant ?? PENDANT_Y.map(() => 'todo' as BeadState);

  const stars = Array.from({ length: bloom.stars }, () => {
    const angle = random() * 360;
    const radius = R + 34 + random() * 108;
    const p = polar(angle, radius);
    return { ...p, size: 1.1 + random() * 2.4, o: 0.25 + random() * 0.6 };
  });

  const petals = Array.from({ length: bloom.petals }, (_, i) => {
    const angle = beadAngle((i / Math.max(1, bloom.petals)) * LOOP_BEADS) + random() * 5;
    const radius = R + 20 + random() * 16;
    const p = polar(angle, radius);
    return { ...p, r: 5.5 + random() * 5, rot: angle + 90, o: 0.3 + random() * 0.45 };
  });

  const rays = Array.from({ length: bloom.rays }, (_, i) => {
    const angle = (360 / Math.max(1, bloom.rays)) * i + bloom.seed * 40;
    const inner = polar(angle, R + 12);
    const outer = polar(angle, R + 46 + (i % 3) * 26);
    return { inner, outer, o: 0.06 + (i % 3) * 0.05 };
  });

  const beadRadius = (bead: LoopBead) => (bead.kind === 'pater' ? 7.6 : 5.4);

  const colorFor = (bead: LoopBead, index: number) => {
    const lit = bead.state === 'done' || (litUntil >= 0 && index < litUntil);
    if (bead.state === 'active') return palette.accent;
    if (lit) return bead.kind === 'pater' ? palette.paterBead : palette.bead;
    return `color-mix(in srgb, ${bead.kind === 'pater' ? palette.paterBead : palette.bead} 34%, transparent)`;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id="ra-glow" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R + 44}>
          <stop offset="0%" stopColor={palette.accent} stopOpacity={0.16 + bloom.luminosity * 0.2} />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ra-chain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.chain} stopOpacity="0.75" />
          <stop offset="100%" stopColor={palette.chain} stopOpacity="0.35" />
        </linearGradient>
        <filter id="ra-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {bloom.faceted && (
          <linearGradient id="ra-facet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        )}
      </defs>

      {/* Halo behind the loop. Kept inside the canvas and faded to nothing at
          its own radius, so no clipped edge can show. */}
      <circle cx={CX} cy={CY} r={R + 44} fill="url(#ra-glow)" />

      {rays.map((ray, i) => (
        <line
          key={`ray-${i}`}
          x1={ray.inner.x}
          y1={ray.inner.y}
          x2={ray.outer.x}
          y2={ray.outer.y}
          stroke={palette.accent}
          strokeOpacity={ray.o * (0.5 + bloom.luminosity / 2)}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      ))}

      {stars.map((star, i) => (
        <path
          key={`star-${i}`}
          transform={`translate(${star.x.toFixed(2)} ${star.y.toFixed(2)}) scale(${star.size.toFixed(2)})`}
          d="M0 -3 C0.5 -1 1 -0.5 3 0 C1 0.5 0.5 1 0 3 C-0.5 1 -1 0.5 -3 0 C-1 -0.5 -0.5 -1 0 -3 Z"
          fill={palette.accent}
          fillOpacity={star.o}
        />
      ))}

      {/* The chain of the loop. */}
      <path
        d={describeLoopArc()}
        fill="none"
        stroke="url(#ra-chain)"
        strokeWidth={bloom.filigree ? 1.6 : 1.1}
        strokeLinecap="round"
      />

      {bloom.filigree &&
        [0, 1, 2, 3, 4].map((d) => {
          const a = beadAngle(d * 11);
          const inner = polar(a, R - 15);
          const outer = polar(a, R + 15);
          return (
            <line
              key={`fil-${d}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={palette.chain}
              strokeOpacity="0.4"
              strokeWidth="0.9"
            />
          );
        })}

      {petals.map((petal, i) => (
        <g
          key={`petal-${i}`}
          transform={`translate(${petal.x.toFixed(2)} ${petal.y.toFixed(2)}) rotate(${petal.rot.toFixed(1)})`}
          opacity={petal.o}
        >
          <path
            d={`M0 ${(-petal.r).toFixed(2)} C ${petal.r.toFixed(2)} ${(-petal.r * 0.6).toFixed(2)}, ${petal.r.toFixed(2)} ${(petal.r * 0.6).toFixed(2)}, 0 ${petal.r.toFixed(2)} C ${(-petal.r).toFixed(2)} ${(petal.r * 0.6).toFixed(2)}, ${(-petal.r).toFixed(2)} ${(-petal.r * 0.6).toFixed(2)}, 0 ${(-petal.r).toFixed(2)} Z`}
            fill={palette.accent}
            fillOpacity="0.5"
          />
          <circle r={petal.r * 0.32} fill={palette.paterBead} fillOpacity="0.8" />
        </g>
      ))}

      {/* Loop beads. */}
      {loop.map((bead, i) => {
        const p = polar(beadAngle(i), R);
        const r = beadRadius(bead);
        const interactive = Boolean(onBeadClick);
        return (
          <g
            key={`bead-${i}`}
            className={bead.state === 'active' ? 'animate-bead' : undefined}
            style={
              bead.state === 'active'
                ? { transformOrigin: `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px` }
                : undefined
            }
          >
            {bead.state === 'active' && (
              <circle cx={p.x} cy={p.y} r={r + 8} fill={palette.accent} opacity="0.3" filter="url(#ra-soft)" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={colorFor(bead, i)}
              stroke={bead.state === 'active' ? palette.accent : palette.chain}
              strokeOpacity={bead.state === 'todo' ? 0.22 : 0.5}
              strokeWidth="0.8"
              onClick={interactive ? () => onBeadClick?.(i) : undefined}
              style={interactive ? { cursor: 'pointer' } : undefined}
            />
            {bloom.faceted && bead.state !== 'todo' && (
              <circle cx={p.x} cy={p.y} r={r} fill="url(#ra-facet)" opacity="0.5" />
            )}
          </g>
        );
      })}

      {/* Pendant: medal, Our Father, three Hail Marys, Our Father, cross. */}
      <path
        d={`M ${MEDAL.x} ${MEDAL.y} L ${MEDAL.x} ${PENDANT_Y[PENDANT_Y.length - 1] + 18}`}
        stroke="url(#ra-chain)"
        strokeWidth="1.1"
      />
      <path
        d={`M ${polar(90 + GAP_DEG / 2, R).x} ${polar(90 + GAP_DEG / 2, R).y}
            Q ${MEDAL.x} ${MEDAL.y - 12} ${MEDAL.x} ${MEDAL.y}
            Q ${MEDAL.x} ${MEDAL.y - 12} ${polar(90 - GAP_DEG / 2, R).x} ${polar(90 - GAP_DEG / 2, R).y}`}
        fill="none"
        stroke="url(#ra-chain)"
        strokeWidth="1.1"
      />

      {bloom.halo && (
        <>
          <circle cx={MEDAL.x} cy={MEDAL.y} r="20" fill="none" stroke={palette.accent} strokeOpacity="0.28" strokeWidth="0.8" />
          <circle cx={MEDAL.x} cy={MEDAL.y} r="26" fill="none" stroke={palette.accent} strokeOpacity="0.14" strokeWidth="0.6" />
        </>
      )}
      <circle cx={MEDAL.x} cy={MEDAL.y} r="13" fill={palette.paterBead} stroke={palette.chain} strokeOpacity="0.6" strokeWidth="0.9" />
      <circle cx={MEDAL.x} cy={MEDAL.y} r="6.5" fill="none" stroke={palette.accent} strokeOpacity="0.6" strokeWidth="0.9" />

      {PENDANT_Y.map((y, i) => {
        const isPater = i === 0 || i === 4;
        const state = pendantStates[i] ?? 'todo';
        const r = isPater ? 7.2 : 5.2;
        const bead: LoopBead = { kind: isPater ? 'pater' : 'ave', state };
        return (
          <g key={`pend-${i}`} className={state === 'active' ? 'animate-bead' : undefined} style={state === 'active' ? { transformOrigin: `${MEDAL.x}px ${y}px` } : undefined}>
            {state === 'active' && <circle cx={MEDAL.x} cy={y} r={r + 8} fill={palette.accent} opacity="0.3" filter="url(#ra-soft)" />}
            <circle
              cx={MEDAL.x}
              cy={y}
              r={r}
              fill={colorFor(bead, -1)}
              stroke={state === 'active' ? palette.accent : palette.chain}
              strokeOpacity={state === 'todo' ? 0.22 : 0.5}
              strokeWidth="0.8"
            />
          </g>
        );
      })}

      {/* The crucifix. */}
      <g stroke={palette.chain} strokeOpacity="0.85" strokeLinecap="round" fill="none">
        <line x1={CX} y1="508" x2={CX} y2="566" strokeWidth="4.2" />
        <line x1={CX - 21} y1="528" x2={CX + 21} y2="528" strokeWidth="4.2" />
      </g>
      <g stroke={palette.accent} strokeOpacity={0.25 + bloom.luminosity * 0.4} strokeLinecap="round" fill="none">
        <line x1={CX} y1="508" x2={CX} y2="566" strokeWidth="1.4" />
        <line x1={CX - 21} y1="528" x2={CX + 21} y2="528" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

function describeLoopArc(): string {
  const start = polar(90 + GAP_DEG / 2, R);
  const end = polar(90 - GAP_DEG / 2, R);
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R} ${R} 0 1 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export { LOOP_BEADS };
