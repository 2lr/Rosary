import Crucifix from '@/components/Crucifix';
import type { Bloom } from '@/lib/rosary/growth';
import { beadFractions, buildLoop, loopPath } from '@/lib/rosary/shapes';

export type BeadState = 'todo' | 'done' | 'active';
export type LoopBead = { kind: 'pater' | 'ave'; state: BeadState };

export type RosaryArtProps = {
  bloom: Bloom;
  /** 55 beads: five decades of one Our Father followed by ten Hail Marys. */
  beads?: LoopBead[];
  /** The four pendant beads, ordered from the medal down to the crucifix. */
  pendant?: BeadState[];
  /** The centre medal, where the Glory Be is prayed. */
  medal?: BeadState;
  /** The crucifix, where the Creed is prayed. */
  cross?: BeadState;
  /** Fraction of the loop lit when no explicit bead states are given. */
  fill?: number;
  className?: string;
  /** Called with the index of a loop bead when it is tapped. */
  onBeadClick?: (index: number) => void;
  title?: string;
};

const W = 400;
const H = 640;
const CX = 200;
const CY = 200;
const R = 150;
const GAP = 0.055;

export const LOOP_BEADS = 55;
export const PENDANT_BEADS = 4;

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
  medal = 'todo',
  cross = 'todo',
  fill = 0,
  className,
  onBeadClick,
  title,
}: RosaryArtProps) {
  const { palette } = bloom;
  const random = rng(bloom.seed);
  const loop = buildLoop(bloom.shape, CX, CY, R);

  const loopBeads: LoopBead[] = beads ?? defaultBeads();
  // Decorative mode: the whole rosary is strung as the fill reaches the end,
  // pendant and medal included, so it reads as one object rather than a loop
  // with a grey tail.
  const decorative = !beads;
  const litUntil = decorative ? Math.round(fill * LOOP_BEADS) : -1;
  const decorativeState = (threshold: number): BeadState =>
    fill >= threshold ? 'done' : 'todo';
  const pendantStates =
    pendant ?? (Array.from({ length: PENDANT_BEADS }, (_, i) => decorativeState(0.9 + i * 0.02)) as BeadState[]);
  const medalState = pendant ? medal : decorativeState(0.88);

  // The pendant hangs from the bottom of the outline, whatever its shape.
  const bottom = loop.at(0);
  const medalY = bottom.y + 22;
  const pendantY = [medalY + 25, medalY + 46, medalY + 67, medalY + 94];
  const crossTop = pendantY[3] + 16;
  const crossHeight = 146;

  // Keep the whole composition centred however tall the chosen shape is.
  const contentTop = CY - loop.ry - 30;
  const contentBottom = crossTop + crossHeight + 8;
  const offsetY = (H - (contentBottom - contentTop)) / 2 - contentTop;

  const fractions = beadFractions(LOOP_BEADS, GAP);

  const stars = Array.from({ length: bloom.stars }, () => {
    const f = random();
    const point = loop.at(f);
    const normal = loop.normalAt(f);
    const distance = 26 + random() * 92;
    return {
      x: point.x + normal.x * distance,
      y: point.y + normal.y * distance,
      size: 1.1 + random() * 2.3,
      o: 0.2 + random() * 0.5,
    };
  });

  const petals = Array.from({ length: bloom.petals }, (_, i) => {
    const f = GAP / 2 + (1 - GAP) * ((i + 0.5) / Math.max(1, bloom.petals));
    const point = loop.at(f);
    const normal = loop.normalAt(f);
    const distance = 19 + random() * 13;
    return {
      x: point.x + normal.x * distance,
      y: point.y + normal.y * distance,
      r: 5.4 + random() * 4.6,
      rot: (Math.atan2(normal.y, normal.x) * 180) / Math.PI + 90,
      o: 0.32 + random() * 0.4,
    };
  });

  const rays = Array.from({ length: bloom.rays }, (_, i) => {
    const f = (i + 0.5) / Math.max(1, bloom.rays);
    const point = loop.at(f);
    const normal = loop.normalAt(f);
    const from = 13;
    const to = 42 + (i % 3) * 24;
    return {
      x1: point.x + normal.x * from,
      y1: point.y + normal.y * from,
      x2: point.x + normal.x * to,
      y2: point.y + normal.y * to,
      o: 0.1 + (i % 3) * 0.06,
    };
  });

  const beadRadius = (bead: LoopBead) => (bead.kind === 'pater' ? 7.6 : 5.4);

  const colorFor = (bead: LoopBead, index: number) => {
    const lit = bead.state === 'done' || (litUntil >= 0 && index < litUntil);
    if (bead.state === 'active') return palette.accent;
    if (lit) return bead.kind === 'pater' ? palette.paterBead : palette.bead;
    return palette.beadIdle;
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
        <radialGradient id="ra-glow" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R + 52}>
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        <filter id="ra-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {bloom.faceted && (
          <linearGradient id="ra-facet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </linearGradient>
        )}
      </defs>

      <g transform={`translate(0 ${offsetY.toFixed(2)})`}>
        <ellipse cx={CX} cy={CY} rx={loop.rx + 52} ry={loop.ry + 52} fill="url(#ra-glow)" />

        {rays.map((ray, i) => (
          <line
            key={`ray-${i}`}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={palette.accent}
            strokeOpacity={ray.o * (0.55 + bloom.luminosity / 2)}
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
          d={loopPath(loop, GAP)}
          fill="none"
          stroke={palette.chain}
          strokeOpacity="0.78"
          strokeWidth={bloom.filigree ? 1.7 : 1.2}
          strokeLinecap="round"
        />

        {bloom.filigree &&
          [0, 1, 2, 3, 4].map((decade) => {
            const f = fractions[decade * 11];
            const point = loop.at(f);
            const normal = loop.normalAt(f);
            return (
              <line
                key={`fil-${decade}`}
                x1={point.x - normal.x * 15}
                y1={point.y - normal.y * 15}
                x2={point.x + normal.x * 15}
                y2={point.y + normal.y * 15}
                stroke={palette.chain}
                strokeOpacity="0.45"
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
              fillOpacity="0.42"
            />
            <circle r={petal.r * 0.32} fill={palette.paterBead} fillOpacity="0.85" />
          </g>
        ))}

        {/* Loop beads: five times an Our Father followed by ten Hail Marys. */}
        {loopBeads.map((bead, i) => {
          const point = loop.at(fractions[i]);
          const r = beadRadius(bead);
          const interactive = Boolean(onBeadClick);
          return (
            <g
              key={`bead-${i}`}
              className={bead.state === 'active' ? 'animate-bead' : undefined}
              style={
                bead.state === 'active'
                  ? { transformOrigin: `${point.x.toFixed(2)}px ${point.y.toFixed(2)}px` }
                  : undefined
              }
            >
              {bead.state === 'active' && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={r + 8}
                  fill={palette.accent}
                  opacity="0.32"
                  filter="url(#ra-soft)"
                />
              )}
              <circle
                cx={point.x}
                cy={point.y}
                r={r}
                fill={colorFor(bead, i)}
                stroke={bead.state === 'active' ? palette.accent : palette.chain}
                strokeOpacity={bead.state === 'todo' ? 0.42 : 0.6}
                strokeWidth="0.8"
                onClick={interactive ? () => onBeadClick?.(i) : undefined}
                style={interactive ? { cursor: 'pointer' } : undefined}
              />
              {bloom.faceted && bead.state !== 'todo' && (
                <circle cx={point.x} cy={point.y} r={r} fill="url(#ra-facet)" opacity="0.55" />
              )}
            </g>
          );
        })}

        {/* The chain closing on the medal, and the pendant below it. */}
        <path
          d={`M ${loop.at(GAP / 2).x.toFixed(2)} ${loop.at(GAP / 2).y.toFixed(2)}
              Q ${CX} ${(medalY - 14).toFixed(2)} ${CX} ${medalY.toFixed(2)}
              Q ${CX} ${(medalY - 14).toFixed(2)} ${loop.at(1 - GAP / 2).x.toFixed(2)} ${loop.at(1 - GAP / 2).y.toFixed(2)}`}
          fill="none"
          stroke={palette.chain}
          strokeOpacity="0.78"
          strokeWidth="1.2"
        />
        <line
          x1={CX}
          y1={medalY}
          x2={CX}
          y2={crossTop}
          stroke={palette.chain}
          strokeOpacity="0.78"
          strokeWidth="1.2"
        />

        {bloom.halo && (
          <>
            <circle cx={CX} cy={medalY} r="20" fill="none" stroke={palette.accent} strokeOpacity="0.3" strokeWidth="0.8" />
            <circle cx={CX} cy={medalY} r="26" fill="none" stroke={palette.accent} strokeOpacity="0.16" strokeWidth="0.6" />
          </>
        )}
        {medalState === 'active' && (
          <circle cx={CX} cy={medalY} r="21" fill={palette.accent} opacity="0.32" filter="url(#ra-soft)" />
        )}
        <circle
          cx={CX}
          cy={medalY}
          r="13"
          fill={
            medalState === 'todo'
              ? palette.beadIdle
              : medalState === 'active'
                ? palette.accent
                : palette.paterBead
          }
          stroke={palette.chain}
          strokeOpacity="0.6"
          strokeWidth="0.9"
        />
        <circle cx={CX} cy={medalY} r="6.5" fill="none" stroke={palette.accent} strokeOpacity="0.65" strokeWidth="0.9" />

        {/* Pendant: three Hail Marys, then the Our Father nearest the cross. */}
        {pendantY.map((y, i) => {
          const isPater = i === PENDANT_BEADS - 1;
          const state = pendantStates[i] ?? 'todo';
          const r = isPater ? 7.4 : 5.4;
          const bead: LoopBead = { kind: isPater ? 'pater' : 'ave', state };
          return (
            <g
              key={`pend-${i}`}
              className={state === 'active' ? 'animate-bead' : undefined}
              style={state === 'active' ? { transformOrigin: `${CX}px ${y}px` } : undefined}
            >
              {state === 'active' && (
                <circle cx={CX} cy={y} r={r + 8} fill={palette.accent} opacity="0.32" filter="url(#ra-soft)" />
              )}
              <circle
                cx={CX}
                cy={y}
                r={r}
                fill={colorFor(bead, -1)}
                stroke={state === 'active' ? palette.accent : palette.chain}
                strokeOpacity={state === 'todo' ? 0.42 : 0.6}
                strokeWidth="0.8"
              />
            </g>
          );
        })}

        {cross === 'active' && (
          <circle
            cx={CX}
            cy={crossTop + crossHeight * 0.32}
            r="30"
            fill={palette.accent}
            opacity="0.24"
            filter="url(#ra-soft)"
          />
        )}
        <Crucifix
          x={CX}
          y={crossTop}
          height={crossHeight}
          wood={palette.wood}
          flesh={palette.flesh}
          cloth={palette.cloth}
          line={palette.outline}
          halo={palette.halo}
        />
      </g>
    </svg>
  );
}
