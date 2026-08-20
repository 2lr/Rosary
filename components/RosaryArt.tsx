import Crucifix from '@/components/Crucifix';
import type { Bloom } from '@/lib/rosary/growth';
import { beadFractions, buildLoop, loopPath, type Loop, type Point } from '@/lib/rosary/shapes';
import { heartGrain, heartGrainSize, type TraitId } from '@/lib/rosary/traits';

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
  /** Traits to draw attention to — what has just changed. */
  highlight?: TraitId[];
  /** Grains laid by the rosary just prayed, lit so they can be picked out. */
  freshGrains?: number;
  /**
   * Frame part of the piece rather than the whole. Give the loop beads that
   * should fill the frame, and whether the pendant belongs in it; everything is
   * still drawn, the window just tightens around what is being prayed.
   */
  focus?: { beads?: number[]; pendant?: boolean } | null;
  className?: string;
  onBeadClick?: (index: number) => void;
  title?: string;
};

const W = 480;
const H = 760;
const CX = 240;
const CY = 270;
const R = 128;
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

/** A point pushed `distance` outwards from the outline. */
function outward(loop: Loop, fraction: number, distance: number): Point & { angle: number } {
  const point = loop.at(fraction);
  const normal = loop.normalAt(fraction);
  return {
    x: point.x + normal.x * distance,
    y: point.y + normal.y * distance,
    angle: (Math.atan2(normal.y, normal.x) * 180) / Math.PI + 90,
  };
}

export default function RosaryArt({
  bloom,
  beads,
  pendant,
  medal = 'todo',
  cross = 'todo',
  fill = 0,
  highlight,
  freshGrains = 0,
  focus = null,
  className,
  onBeadClick,
  title,
}: RosaryArtProps) {
  const { palette, growth } = bloom;
  // SVG ids are global to the document, so two rosaries on one page would share
  // a gradient. Derive a stable suffix from what actually defines the paint.
  const uid = idFrom(`${bloom.seed}|${palette.accent}|${palette.stone}|${palette.glow}`);
  const glowId = `ra-glow-${uid}`;
  const softId = `ra-soft-${uid}`;
  const stoneId = `ra-stone-${uid}`;
  const random = rng(bloom.seed);
  const loop = buildLoop(bloom.shape, CX, CY, R);
  const hot = new Set(highlight ?? []);

  const v = growth.value;
  const n = growth.notch;

  const loopBeads: LoopBead[] = beads ?? defaultBeads();
  const decorative = !beads;
  const litUntil = decorative ? Math.round(fill * LOOP_BEADS) : -1;
  const decorativeState = (threshold: number): BeadState => (fill >= threshold ? 'done' : 'todo');
  const pendantStates =
    pendant ??
    (Array.from({ length: PENDANT_BEADS }, (_, i) =>
      decorativeState(0.9 + i * 0.02),
    ) as BeadState[]);
  const medalState = pendant ? medal : decorativeState(0.88);

  const stoneR = v.stone;
  const facets = n.stoneFacets;

  // The pendant hangs from the bottom of the outline, whatever its shape.
  const bottom = loop.at(0);
  const medalY = bottom.y + stoneR + 11;
  // The medal sits in the crescent, so the pendant starts below it.
  const moonDrop = n.moon ? stoneR * 0.95 : 0;
  const pendantY = [
    medalY + 25 + moonDrop,
    medalY + 46 + moonDrop,
    medalY + 67 + moonDrop,
    medalY + 94 + moonDrop,
  ];
  const crossTop = pendantY[3] + 16;
  const crossHeight = v.crossHeight;

  const raysInner = 30;

  // The signs stack upwards from the loop: dove, then the three circles, then
  // the hand. The canvas has to leave room for whichever has arrived.
  const signHeight = n.glory ? 184 : n.triquetra ? 100 : n.dove ? 62 : 24;
  const contentTop = CY - loop.ry - Math.max(raysInner + 70, signHeight);
  const contentBottom = crossTop + crossHeight + (n.lilies ? 30 : 8);
  // Stars are sparse dots; letting the odd one sit at the very edge costs
  // nothing and keeps the piece itself from being shrunk.
  const contentHalfWidth = loop.rx + raysInner + 30;

  // A rosary that has been prayed for years carries a great deal. Rather than
  // let it grow out of the frame, the whole composition is scaled to fit — the
  // piece gets richer, the frame stays the same.
  const scale = Math.min(
    1,
    (W - 10) / (contentHalfWidth * 2),
    (H - 10) / (contentBottom - contentTop),
  );
  const offsetX = CX - CX * scale;
  const offsetY = (H - (contentBottom - contentTop) * scale) / 2 - contentTop * scale;

  const fractions = beadFractions(LOOP_BEADS, GAP);

  // The whole piece drawn at the width of a phone leaves each bead two or three
  // pixels across — too small to follow with a thumb. Framing only the decade in
  // hand makes the beads legible, and the frame is landscape so it can use the
  // full width of the screen instead of a narrow column.
  const focusBeads = (focus?.beads ?? []).filter((i) => i >= 0 && i < LOOP_BEADS);

  // A decade sitting on the side of the loop occupies a nearly square patch,
  // most of it the empty inside of the curve. Turning the piece so the decade
  // in hand rests at the top makes it a wide shallow band instead — which is
  // the shape a phone has room for, and which lets the beads be far larger.
  // The pendant is never turned: a crucifix hangs downwards or not at all.
  const spin = (() => {
    if (!focus || focus.pendant || focusBeads.length === 0) return 0;
    const middle = loop.at(fractions[focusBeads[Math.floor(focusBeads.length / 2)]]);
    return -90 - (Math.atan2(middle.y - CY, middle.x - CX) * 180) / Math.PI;
  })();

  const turned = (p: Point): Point => {
    if (!spin) return p;
    const radians = (spin * Math.PI) / 180;
    const dx = p.x - CX;
    const dy = p.y - CY;
    return {
      x: CX + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: CY + dx * Math.sin(radians) + dy * Math.cos(radians),
    };
  };

  const focusBox = (() => {
    if (!focus || (focusBeads.length === 0 && !focus.pendant)) return null;

    const points: Point[] = focusBeads.map((i) => turned(loop.at(fractions[i])));
    if (focus.pendant) {
      points.push({ x: CX, y: bottom.y }, { x: CX, y: crossTop + crossHeight });
    }

    const pad = Math.max(v.paterRadius, v.aveRadius) + 20;
    const edge = (values: number[], sign: number) =>
      (sign < 0 ? Math.min(...values) - pad : Math.max(...values) + pad);
    const left = edge(points.map((p) => p.x), -1) * scale + offsetX;
    const right = edge(points.map((p) => p.x), 1) * scale + offsetX;
    const top = edge(points.map((p) => p.y), -1) * scale + offsetY;
    const foot = edge(points.map((p) => p.y), 1) * scale + offsetY;

    // The window hugs the beads rather than holding a fixed shape: a decade
    // across the top of the loop is wide and shallow, one down its side is
    // tall and narrow, and forcing either into the other's proportions only
    // buys empty space inside the curve. The element letterboxes what it gets,
    // so the tighter the window the larger the beads. The floors keep a single
    // bead from filling the frame on its own.
    const width = Math.max(right - left, 150);
    const height = Math.max(foot - top, 105);
    return {
      x: (left + right) / 2 - width / 2,
      y: (top + foot) / 2 - height / 2,
      width,
      height,
    };
  })();

  const viewBox = focusBox
    ? `${focusBox.x.toFixed(1)} ${focusBox.y.toFixed(1)} ${focusBox.width.toFixed(1)} ${focusBox.height.toFixed(1)}`
    : `0 0 ${W} ${H}`;

  const stars = Array.from({ length: growth.stars }, () => {
    const f = random();
    const distance = raysInner + 18 + random() * 44;
    const p = outward(loop, f, distance);
    return { x: p.x, y: p.y, size: 1.1 + random() * 2.3, o: 0.2 + random() * 0.5 };
  });

  const roses = Array.from({ length: n.roses }, (_, i) => {
    const f = GAP / 2 + (1 - GAP) * ((i + 0.5) / Math.max(1, n.roses));
    const p = outward(loop, f, 15 + random() * 7);
    return { ...p, r: 6 + random() * 3.6, o: 0.6 + random() * 0.35 };
  });

  const leaves = Array.from({ length: n.leaves }, (_, i) => {
    const f = GAP / 2 + (1 - GAP) * ((i + 0.35) / Math.max(1, n.leaves));
    const p = outward(loop, f, 21 + random() * 7);
    return { ...p, r: 4.4 + random() * 2.6, o: 0.45 + random() * 0.3, flip: random() > 0.5 };
  });

  const rays = Array.from({ length: n.rays }, (_, i) => {
    const f = (i + 0.5) / Math.max(1, n.rays);
    const a = outward(loop, f, raysInner);
    const b = outward(loop, f, raysInner + 26 + (i % 3) * 20);
    return { a, b, o: 0.1 + (i % 3) * 0.05 };
  });

  const colorFor = (bead: LoopBead, index: number) => {
    const lit = bead.state === 'done' || (litUntil >= 0 && index < litUntil);
    if (bead.state === 'active') return palette.accent;
    if (lit) return bead.kind === 'pater' ? palette.paterBead : palette.bead;
    return palette.beadIdle;
  };

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={glowId} gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R + 52}>
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        <filter id={softId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id={stoneId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={palette.stoneLight} />
          <stop offset="52%" stopColor={palette.stone} />
          <stop offset="100%" stopColor={palette.stoneDark} />
        </linearGradient>
      </defs>

      <g
        transform={
          `translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})` +
          (spin ? ` rotate(${spin.toFixed(2)} ${CX} ${CY})` : '')
        }
      >
        {n.roseWindow === 1 && <RoseWindow loop={loop} color={palette.chain} />}
        <RoseHeart
          loop={loop}
          grains={growth.heart.grains}
          fresh={freshGrains}
          color={palette.goldLeaf}
          freshColor={palette.accent}
          gradientId={`ra-heart-${uid}`}
        />
        {n.chiRho === 1 && (
          <ChiRho
            x={CX}
            y={CY}
            size={Math.min(loop.rx, loop.ry) * 0.42}
            color={palette.goldLeaf}
          />
        )}

        {/* The halo is sized to sit behind the whole piece. Framed on a single
            decade it covers the window edge to edge, which reads as a tinted
            rectangle rather than a glow, so it steps aside. */}
        {!focusBox && (
          <ellipse cx={CX} cy={CY} rx={loop.rx + 52} ry={loop.ry + 52} fill={`url(#${glowId})`} />
        )}

        {rays.map((ray, i) => (
          <line
            key={`ray-${i}`}
            x1={ray.a.x}
            y1={ray.a.y}
            x2={ray.b.x}
            y2={ray.b.y}
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
          strokeWidth={1.2 + v.gold * 0.8}
          strokeLinecap="round"
        />

        {Array.from({ length: n.filigree }, (_, i) => {
          const f = GAP / 2 + (1 - GAP) * ((i + 0.5) / Math.max(1, n.filigree));
          const a = outward(loop, f, -13);
          const b = outward(loop, f, 13);
          return (
            <line
              key={`fil-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={palette.goldLeaf}
              strokeOpacity={0.28 + v.gold * 0.3}
              strokeWidth="0.9"
            />
          );
        })}

        {leaves.map((leaf, i) => (
          <g
            key={`leaf-${i}`}
            transform={`translate(${leaf.x.toFixed(2)} ${leaf.y.toFixed(2)}) rotate(${(leaf.angle + (leaf.flip ? 40 : -40)).toFixed(1)})`}
            opacity={leaf.o}
          >
            <path
              d={`M0 ${-leaf.r} Q ${leaf.r * 0.62} 0 0 ${leaf.r} Q ${-leaf.r * 0.62} 0 0 ${-leaf.r} Z`}
              fill={palette.leaf}
            />
            <line
              x1="0"
              y1={-leaf.r * 0.8}
              x2="0"
              y2={leaf.r * 0.8}
              stroke={palette.chain}
              strokeOpacity="0.3"
              strokeWidth="0.4"
            />
          </g>
        ))}

        {roses.map((rose, i) => (
          <g
            key={`rose-${i}`}
            className={hot.has('roses') && i === roses.length - 1 ? 'animate-bead' : undefined}
            transform={`translate(${rose.x.toFixed(2)} ${rose.y.toFixed(2)}) rotate(${rose.angle.toFixed(1)})`}
            opacity={rose.o}
          >
            {[0, 1, 2, 3, 4].map((petal) => (
              <ellipse
                key={petal}
                rx={rose.r * 0.5}
                ry={rose.r}
                cy={-rose.r * 0.36}
                transform={`rotate(${petal * 72})`}
                fill={palette.rose}
                fillOpacity="0.72"
              />
            ))}
            <circle r={rose.r * 0.3} fill={palette.goldLeaf} fillOpacity="0.9" />
          </g>
        ))}

        {/* Loop beads: five times an Our Father followed by ten Hail Marys. */}
        {loopBeads.map((bead, i) => {
          const point = loop.at(fractions[i]);
          const r = bead.kind === 'pater' ? v.paterRadius : v.aveRadius;
          const interactive = Boolean(onBeadClick);
          const grown =
            (bead.kind === 'pater' && hot.has('paterRadius')) ||
            (bead.kind === 'ave' && hot.has('aveRadius'));
          return (
            <g
              key={`bead-${i}`}
              className={bead.state === 'active' || grown ? 'animate-bead' : undefined}
              style={
                bead.state === 'active' || grown
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
                  filter={`url(#${softId})`}
                />
              )}
              <Bead
                x={point.x}
                y={point.y}
                r={r}
                fill={colorFor(bead, i)}
                stroke={bead.state === 'active' ? palette.accent : palette.chain}
                strokeOpacity={bead.state === 'todo' ? 0.42 : 0.6}
                cut={bead.state === 'todo' ? 0 : v.cut}
                dew={bead.state === 'todo' ? 0 : v.dew}
                onClick={interactive ? () => onBeadClick?.(i) : undefined}
              />
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
          strokeWidth={1.2 + v.gold * 0.8}
        />
        <line
          x1={CX}
          y1={medalY}
          x2={CX}
          y2={crossTop}
          stroke={palette.chain}
          strokeOpacity="0.78"
          strokeWidth={1.2 + v.gold * 0.6}
        />

        {n.moon === 1 && <Crescent x={CX} y={medalY} r={stoneR} outline={palette.chain} />}

        {Array.from({ length: n.haloRings }, (_, i) => (
          <circle
            key={`halo-${i}`}
            cx={CX}
            cy={medalY}
            r={stoneR + 4.5 + i * 3.6}
            fill="none"
            stroke={palette.goldLeaf}
            strokeOpacity={0.3 - i * 0.045}
            strokeWidth="0.8"
          />
        ))}

        {n.crown === 1 && (
          <g fill={palette.goldLeaf} fillOpacity="0.8">
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const radius = stoneR + 13;
              return (
                <path
                  key={`crown-${i}`}
                  transform={`translate(${(CX + Math.cos(angle) * radius).toFixed(2)} ${(medalY + Math.sin(angle) * radius).toFixed(2)}) scale(1.15)`}
                  d="M0 -3 C0.5 -1 1 -0.5 3 0 C1 0.5 0.5 1 0 3 C-0.5 1 -1 0.5 -3 0 C-1 -0.5 -0.5 -1 0 -3 Z"
                />
              );
            })}
          </g>
        )}

        {(medalState === 'active' || hot.has('stone') || hot.has('stoneFacets')) && (
          <circle
            cx={CX}
            cy={medalY}
            r={stoneR + 8}
            fill={palette.accent}
            opacity="0.3"
            filter={`url(#${softId})`}
          />
        )}
        <Stone
          x={CX}
          y={medalY}
          r={stoneR}
          facets={facets}
          engraving={v.engraving}
          active={medalState === 'active'}
          idle={medalState === 'todo'}
          palette={palette}
          gradientId={stoneId}
          monogram={n.monogram === 1}
        />

        {/* Pendant: three Hail Marys, then the Our Father nearest the cross. */}
        {pendantY.map((y, i) => {
          const isPater = i === PENDANT_BEADS - 1;
          const state = pendantStates[i] ?? 'todo';
          const r = isPater ? v.paterRadius : v.aveRadius;
          const bead: LoopBead = { kind: isPater ? 'pater' : 'ave', state };
          return (
            <g
              key={`pend-${i}`}
              className={state === 'active' ? 'animate-bead' : undefined}
              style={state === 'active' ? { transformOrigin: `${CX}px ${y}px` } : undefined}
            >
              {state === 'active' && (
                <circle cx={CX} cy={y} r={r + 8} fill={palette.accent} opacity="0.32" filter={`url(#${softId})`} />
              )}
              <Bead
                x={CX}
                y={y}
                r={r}
                fill={colorFor(bead, -1)}
                stroke={state === 'active' ? palette.accent : palette.chain}
                strokeOpacity={state === 'todo' ? 0.42 : 0.6}
                cut={state === 'todo' ? 0 : v.cut}
                dew={state === 'todo' ? 0 : v.dew}
              />
            </g>
          );
        })}

        {n.flames === 1 && (
          <Flames x={CX} y={CY - loop.ry - 34} color={palette.goldLeaf} accent={palette.accent} />
        )}
        {n.dove === 1 && (
          <Dove
            x={CX}
            y={CY - loop.ry - 34}
            scale={1.7 + v.chroma * 0.4}
            color={palette.goldLeaf}
            outline={palette.chain}
            highlight={hot.has('dove')}
          />
        )}
        {n.triquetra === 1 && (
          <Triquetra x={CX} y={CY - loop.ry - 82} r={12} color={palette.chain} highlight={hot.has('triquetra')} />
        )}
        {n.glory === 1 && (
          <RadiantTriangle
            x={CX}
            y={CY - loop.ry - 136}
            color={palette.goldLeaf}
            gradientId={`ra-glory-${uid}`}
            highlight={hot.has('glory')}
          />
        )}

        {cross === 'active' && (
          <circle
            cx={CX}
            cy={crossTop + crossHeight * 0.32}
            r="30"
            fill={palette.accent}
            opacity="0.24"
            filter={`url(#${softId})`}
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
          alphaOmega={n.alphaOmega === 1}
        />

        {n.lilies === 1 && (
          <Lilies
            x={CX}
            y={crossTop + crossHeight - 4}
            scale={1.5}
            color={palette.rose}
            leaf={palette.leaf}
          />
        )}
      </g>
    </svg>
  );
}

/** A bead, with the cut and the highlight it has earned. */
function Bead({
  x,
  y,
  r,
  fill,
  stroke,
  strokeOpacity,
  cut,
  dew,
  onClick,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  stroke: string;
  strokeOpacity: number;
  cut: number;
  dew: number;
  onClick?: () => void;
}) {
  return (
    <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth="0.8"
      />
      {cut > 0.02 && (
        <>
          <path
            d={`M ${x - r * 0.72} ${y + r * 0.34} A ${r} ${r} 0 0 1 ${x + r * 0.34} ${y - r * 0.72} A ${r * 1.5} ${r * 1.5} 0 0 0 ${x - r * 0.72} ${y + r * 0.34} Z`}
            fill="#ffffff"
            fillOpacity={0.3 * cut}
          />
          <path
            d={`M ${x + r * 0.76} ${y - r * 0.28} A ${r} ${r} 0 0 1 ${x - r * 0.28} ${y + r * 0.76} A ${r * 1.4} ${r * 1.4} 0 0 0 ${x + r * 0.76} ${y - r * 0.28} Z`}
            fill="#000000"
            fillOpacity={0.13 * cut}
          />
        </>
      )}
      {dew > 0.02 && (
        <circle
          cx={x - r * 0.34}
          cy={y - r * 0.38}
          r={r * 0.2}
          fill="#ffffff"
          fillOpacity={0.55 * dew}
        />
      )}
    </g>
  );
}

/** The centre stone: a plain medal at first, cut into a gem as it grows. */
function Stone({
  x,
  y,
  r,
  facets,
  engraving,
  active,
  idle,
  palette,
  gradientId,
  monogram,
}: {
  x: number;
  y: number;
  r: number;
  facets: number;
  engraving: number;
  active: boolean;
  idle: boolean;
  palette: Bloom['palette'];
  gradientId: string;
  monogram: boolean;
}) {
  const fill = idle ? palette.beadIdle : active ? palette.accent : `url(#${gradientId})`;
  const sides = facets === 0 ? 0 : facets + 4;
  const points = Array.from({ length: Math.max(3, sides) }, (_, i) => {
    const angle = (i / Math.max(3, sides)) * Math.PI * 2 - Math.PI / 2;
    return { x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r };
  });
  const table = points.map((p) => ({ x: x + (p.x - x) * 0.52, y: y + (p.y - y) * 0.52 }));
  const toPath = (list: { x: number; y: number }[]) =>
    list.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  return (
    <g>
      {sides >= 5 ? (
        <>
          <polygon
            points={toPath(points)}
            fill={fill}
            stroke={palette.chain}
            strokeOpacity="0.6"
            strokeWidth="0.9"
          />
          {points.map((p, i) => (
            <line
              key={`facet-${i}`}
              x1={p.x}
              y1={p.y}
              x2={table[i].x}
              y2={table[i].y}
              stroke="#ffffff"
              strokeOpacity="0.22"
              strokeWidth="0.6"
            />
          ))}
          <polygon
            points={toPath(table)}
            fill="#ffffff"
            fillOpacity="0.14"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="0.6"
          />
        </>
      ) : (
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={fill}
          stroke={palette.chain}
          strokeOpacity="0.6"
          strokeWidth="0.9"
        />
      )}

      {engraving > 0.05 && (
        <circle
          cx={x}
          cy={y}
          r={r * 0.74}
          fill="none"
          stroke={palette.goldLeaf}
          strokeOpacity={0.3 + engraving * 0.45}
          strokeWidth="0.7"
        />
      )}
      {monogram && (
        // The A and the M under the cross, as on the Miraculous Medal.
        <g
          stroke={palette.goldLeaf}
          strokeOpacity={0.7 + engraving * 0.3}
          strokeWidth={Math.max(0.7, r * 0.075)}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <line x1={x} y1={y - r * 0.9} x2={x} y2={y - r * 0.44} />
          <line x1={x - r * 0.18} y1={y - r * 0.74} x2={x + r * 0.18} y2={y - r * 0.74} />
          <line x1={x - r * 0.44} y1={y - r * 0.4} x2={x + r * 0.44} y2={y - r * 0.4} />
          <path
            d={`M ${x - r * 0.42} ${y + r * 0.58} L ${x - r * 0.42} ${y - r * 0.22} L ${x} ${y + r * 0.26} L ${x + r * 0.42} ${y - r * 0.22} L ${x + r * 0.42} ${y + r * 0.58}`}
          />
        </g>
      )}
      <circle cx={x - r * 0.3} cy={y - r * 0.34} r={r * 0.16} fill="#ffffff" fillOpacity="0.4" />
    </g>
  );
}

/**
 * One grain for every decade ever prayed, laid at the golden angle from the one
 * before it. The newest grains are lit, so the ones just added can be found.
 *
 * Past a few hundred, the packed middle is drawn as one disc rather than as
 * thousands of nodes; the rim, where every new grain lands, is still drawn
 * grain by grain, so a single decade is always visible.
 */
const MAX_DRAWN_GRAINS = 560;

function RoseHeart({
  loop,
  grains,
  fresh,
  color,
  freshColor,
  gradientId,
}: {
  loop: Loop;
  grains: number;
  fresh: number;
  color: string;
  freshColor: string;
  gradientId: string;
}) {
  if (grains === 0) return null;

  const field = Math.min(loop.rx, loop.ry) * 0.78;
  const grainR = Math.max(0.3, heartGrainSize(grains) * field);
  const drawnFrom = Math.max(0, grains - MAX_DRAWN_GRAINS);
  const freshFrom = Math.max(drawnFrom, grains - fresh);
  const coreR = drawnFrom > 0 ? heartGrain(drawnFrom - 1, grains).radius * field + grainR : 0;
  // The packed middle must read at the same density as the grains around it,
  // or it shows up as a flat blob in the middle of a delicate texture.
  // Scattered dots read stronger than a flat wash of the same average, so the
  // core is nudged up a little to match what the eye sees.
  const coreCoverage =
    coreR > 0 ? Math.min(1, (1.35 * drawnFrom * grainR * grainR) / (coreR * coreR)) : 0;

  const settled: string[] = [];
  const lit: { x: number; y: number }[] = [];

  for (let i = drawnFrom; i < grains; i++) {
    const { angle, radius } = heartGrain(i, grains);
    const rad = (angle * Math.PI) / 180;
    const x = loop.cx + Math.cos(rad) * radius * field;
    const y = loop.cy + Math.sin(rad) * radius * field;
    if (i >= freshFrom) {
      lit.push({ x, y });
    } else {
      const r = grainR;
      settled.push(
        `M ${x.toFixed(2)} ${y.toFixed(2)} m ${-r.toFixed(2)} 0 a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(r * 2).toFixed(2)} 0 a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-r * 2).toFixed(2)} 0`,
      );
    }
  }

  return (
    <g>
      {coreR > 0 && (
        <>
          <defs>
            <radialGradient id={gradientId}>
              <stop offset="0%" stopColor={color} stopOpacity={0.5 * coreCoverage} />
              <stop offset="90%" stopColor={color} stopOpacity={0.5 * coreCoverage} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={loop.cx} cy={loop.cy} r={coreR} fill={`url(#${gradientId})`} />
        </>
      )}
      <path d={settled.join(' ')} fill={color} fillOpacity="0.5" />
      {lit.map((grain, i) => (
        <circle
          key={i}
          cx={grain.x}
          cy={grain.y}
          r={grainR * 2.2}
          fill={freshColor}
          fillOpacity="0.95"
        />
      ))}
    </g>
  );
}

/** Tracery behind the loop, once the rosary has been prayed a very long time. */
function RoseWindow({ loop, color }: { loop: Loop; color: string }) {
  const petals = 12;
  const r = Math.min(loop.rx, loop.ry) * 0.72;
  return (
    <g stroke={color} strokeOpacity="0.16" fill="none" strokeWidth="0.9">
      <circle cx={loop.cx} cy={loop.cy} r={r / 2} />
      {Array.from({ length: petals }, (_, i) => {
        const angle = (i / petals) * Math.PI * 2;
        return (
          <circle
            key={`petal-${i}`}
            cx={loop.cx + (Math.cos(angle) * r) / 2}
            cy={loop.cy + (Math.sin(angle) * r) / 2}
            r={r / 2}
          />
        );
      })}
      <circle cx={loop.cx} cy={loop.cy} r={r} strokeOpacity="0.1" />
    </g>
  );
}

function Dove({
  x,
  y,
  scale,
  color,
  outline,
  highlight,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
  outline: string;
  highlight: boolean;
}) {
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)})`}
      className={highlight ? 'animate-bead' : undefined}
    >
      <g fill={color} stroke={outline} strokeWidth="0.5" strokeLinejoin="round">
        {/* Body and tail, descending. */}
        <path d="M -1.5 -1 C 4 -3.5, 10 -1, 12 2 C 9.5 3.6, 5 4.4, 1 3.4 L -9.5 6.8 L -3.5 2 Z" />
        {/* Wings raised. */}
        <path d="M 0 -1.4 C -1.5 -8.5, 3 -13.5, 7.5 -13 C 6 -8, 3.5 -3.6, 0.6 -1.2 Z" />
        <path d="M 1.4 -0.6 C 3 -7, 8.5 -10.4, 12.5 -9.4 C 10 -5.4, 6 -2, 2 -0.2 Z" />
        {/* Head. */}
        <circle cx="12.4" cy="1.4" r="2.1" stroke="none" />
        <path d="M 14.2 1.2 L 17 1.9 L 14.1 2.6 Z" stroke="none" />
      </g>
    </g>
  );
}

function Lilies({
  x,
  y,
  scale,
  color,
  leaf,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
  leaf: string;
}) {
  const one = (dx: number, flip: number) => (
    <g transform={`translate(${dx} 0) scale(${flip} 1)`}>
      <path
        d={`M 0 0 C -1 -8, -3 -13, -6 -16`}
        stroke={leaf}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <g transform="translate(-6 -16) rotate(-24)" fill={color} fillOpacity="0.85">
        <ellipse rx="1.9" ry="6.2" />
        <ellipse rx="1.9" ry="6.2" transform="rotate(52)" />
        <ellipse rx="1.9" ry="6.2" transform="rotate(-52)" />
      </g>
      <path
        d="M 0 -1 C -4 -4, -7 -6, -10 -6.5 C -7.5 -3.5, -4 -1.5, 0 -1 Z"
        fill={leaf}
        fillOpacity="0.65"
      />
    </g>
  );

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale})`}>
      {one(-4, 1)}
      {one(4, -1)}
    </g>
  );
}

/** A short, stable suffix so each rosary owns its gradients. */
function idFrom(key: string): string {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** The seven gifts, in an arc over the dove. */
function Flames({ x, y, color, accent }: { x: number; y: number; color: string; accent: string }) {
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => {
        const angle = -150 + (120 / 6) * i;
        const rad = (angle * Math.PI) / 180;
        const radius = 26;
        return (
          <g
            key={`flame-${i}`}
            transform={`translate(${(x + Math.cos(rad) * radius).toFixed(2)} ${(y + Math.sin(rad) * radius).toFixed(2)}) rotate(${angle + 90})`}
          >
            <path
              d="M 0 0 C -2.6 -3.4, -1.8 -7.2, 0 -9.8 C 1.8 -7.2, 2.6 -3.4, 0 0 Z"
              fill={color}
              fillOpacity="0.78"
            />
            <path
              d="M 0 -1.6 C -1.2 -3.4, -0.9 -5.6, 0 -7.2 C 0.9 -5.6, 1.2 -3.4, 0 -1.6 Z"
              fill={accent}
              fillOpacity="0.5"
            />
          </g>
        );
      })}
    </g>
  );
}

/** The moon under her feet: the medal comes to rest in its cradle. */
function Crescent({ x, y, r, outline }: { x: number; y: number; r: number; outline: string }) {
  const circle = (cx: number, cy: number, radius: number) =>
    `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy} Z`;
  return (
    <path
      d={`${circle(x, y + r * 0.45, r * 1.55)} ${circle(x, y + r * 0.02, r * 1.36)}`}
      fillRule="evenodd"
      // Moonlight, not another accent: the moon has to read as the moon.
      fill="#e9e4d8"
      fillOpacity="0.95"
      stroke={outline}
      strokeOpacity="0.4"
      strokeWidth="0.7"
    />
  );
}

/** Three circles, no beginning and no end, that cannot be pulled apart. */
function Triquetra({
  x,
  y,
  r,
  color,
  highlight,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  highlight: boolean;
}) {
  return (
    <g
      className={highlight ? 'animate-bead' : undefined}
      fill="none"
      stroke={color}
      strokeOpacity="0.75"
      strokeWidth="1.2"
    >
      {[-90, 30, 150].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={angle}
            cx={x + Math.cos(rad) * r * 0.56}
            cy={y + Math.sin(rad) * r * 0.56}
            r={r * 0.72}
          />
        );
      })}
    </g>
  );
}

/** The oldest monogram of Christ, at the centre of the crown. */
function ChiRho({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const s = size;
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      fill="none"
      stroke={color}
      strokeOpacity="0.2"
      strokeWidth={Math.max(1.6, s * 0.075)}
      strokeLinecap="round"
    >
      {/* The stem and the bowl of the rho. */}
      <line x1="0" y1={-s} x2="0" y2={s} />
      <path d={`M 0 ${-s} C ${s * 0.62} ${-s * 1.04}, ${s * 0.62} ${-s * 0.36}, 0 ${-s * 0.34}`} />
      {/* The chi across it. */}
      <line x1={-s * 0.74} y1={-s * 0.74} x2={s * 0.74} y2={s * 0.74} />
      <line x1={-s * 0.74} y1={s * 0.74} x2={s * 0.74} y2={-s * 0.74} />
    </g>
  );
}

/**
 * The triangle in glory, at the summit.
 *
 * Three equal sides and a light all around: the way God is shown on the
 * pediment of an altarpiece. Nothing inside it — a shape and a light read at
 * forty pixels, where any figure or lettering would not.
 */
function RadiantTriangle({
  x,
  y,
  color,
  gradientId,
  highlight,
}: {
  x: number;
  y: number;
  color: string;
  gradientId: string;
  highlight: boolean;
}) {
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      className={highlight ? 'animate-bead' : undefined}
    >
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="30" fill={`url(#${gradientId})`} />
      <g stroke={color} strokeWidth="1.15" strokeLinecap="round">
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const outer = i % 2 ? 30 : 42;
          return (
            <line
              key={i}
              x1={Math.cos(angle) * 28}
              y1={Math.sin(angle) * 28}
              x2={Math.cos(angle) * outer}
              y2={Math.sin(angle) * outer}
              strokeOpacity={i % 2 ? 0.35 : 0.55}
            />
          );
        })}
      </g>
      <path
        d="M 0 -26 L 26 19 L -26 19 Z"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M 0 -18.5 L 18.5 13.5 L -18.5 13.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.45"
        strokeLinejoin="round"
      />
    </g>
  );
}
