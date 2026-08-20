/**
 * The crucifix at the foot of the rosary, with the body of Christ on it.
 *
 * Drawn in its own 120×150 box and scaled into place, so the same figure holds
 * at forty pixels on the prayer screen and at a hundred and twenty on the
 * completion screen. The corpus is built from tapered silhouettes rather than
 * shading: at these sizes a clear outline keeps its dignity where modelling
 * would turn to mud.
 */
export type CrucifixProps = {
  /** Centre of the cross, horizontally, in the parent's coordinates. */
  x: number;
  /** Top of the cross in the parent's coordinates. */
  y: number;
  /** Height of the whole cross in the parent's coordinates. */
  height: number;
  wood: string;
  /** The body. */
  flesh: string;
  /** Hair, beard and loincloth. */
  cloth: string;
  /** Outline. */
  line: string;
  halo: string;
  /** Drops the halo and the titulus when the cross is drawn very small. */
  detail?: boolean;
  opacity?: number;
};

const BOX_W = 120;
const BOX_H = 150;

export default function Crucifix({
  x,
  y,
  height,
  wood,
  flesh,
  cloth,
  line,
  halo,
  detail = true,
  opacity = 1,
}: CrucifixProps) {
  const scale = height / BOX_H;

  return (
    <g
      transform={`translate(${(x - (BOX_W * scale) / 2).toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})`}
      opacity={opacity}
    >
      <g fill={wood}>
        <rect x="55.6" y="0" width="8.8" height="150" rx="1.5" />
        <rect x="15" y="36" width="90" height="8.8" rx="1.5" />
      </g>

      {detail && (
        <>
          {/* Titulus — the board Pilate had fixed above the cross. */}
          <rect x="48.8" y="13.5" width="22.4" height="10" rx="1.3" fill={wood} />
          <g stroke={flesh} strokeOpacity="0.6" strokeWidth="0.85" strokeLinecap="round">
            <line x1="52.6" y1="18.4" x2="53.8" y2="18.4" />
            <line x1="56.3" y1="18.4" x2="57.5" y2="18.4" />
            <line x1="60" y1="18.4" x2="61.2" y2="18.4" />
            <line x1="63.7" y1="18.4" x2="67.2" y2="18.4" />
          </g>
          <circle
            cx="59"
            cy="31.4"
            r="10.2"
            fill="none"
            stroke={halo}
            strokeOpacity="0.7"
            strokeWidth="1.2"
          />
        </>
      )}

      <g stroke={line} strokeWidth="0.85" strokeLinejoin="round" strokeLinecap="round">
        {/* Hair, framing the face. */}
        <path
          fill={cloth}
          d="M 53.9 32.6 C 53.4 26.4, 56 22.6, 59.4 22.6 C 63 22.6, 65.2 26.2, 64.6 32.4 C 64.2 36.6, 63.4 38.4, 62.6 39.2 C 63.4 35, 62.8 31.6, 61.6 30.2 C 59.6 31.2, 56.6 31, 55.2 29.6 C 54.6 32, 54.8 36, 55.4 39 C 54.6 38, 54.1 35.8, 53.9 32.6 Z"
        />

        {/* Arms: the nailed hands at the beam, sloping down to the shoulders. */}
        <path
          fill={flesh}
          d="M 22.4 38.4 C 33 40.9, 44 42.7, 53.8 44.7 L 53.4 49.9 C 43.6 47.7, 32.6 45.1, 22.8 42.5 Z"
        />
        <path
          fill={flesh}
          d="M 97.6 38.4 C 87 40.9, 76 42.7, 66.2 44.7 L 66.6 49.9 C 76.4 47.7, 87.4 45.1, 97.2 42.5 Z"
        />
        <circle cx="22.2" cy="40.5" r="2.1" fill={flesh} />
        <circle cx="97.8" cy="40.5" r="2.1" fill={flesh} />

        <path fill={flesh} d="M 57.2 35.4 L 61.8 35.4 L 62.4 46.4 L 56.8 46.4 Z" />

        {/* Face, inclined towards his right shoulder. */}
        <path
          fill={flesh}
          d="M 55.2 29.2 C 55.2 25.4, 57 23.4, 59.4 23.4 C 61.8 23.4, 63.5 25.4, 63.4 29.2 C 63.3 33.6, 61.8 38.6, 59.3 38.6 C 56.8 38.6, 55.3 33.6, 55.2 29.2 Z"
        />
        <path
          fill={cloth}
          stroke="none"
          d="M 56 32.4 C 56.6 36.8, 57.8 38.8, 59.3 38.8 C 60.8 38.8, 62 36.8, 62.6 32.4 C 62.4 35.6, 61.4 37.6, 59.3 37.6 C 57.2 37.6, 56.2 35.6, 56 32.4 Z"
        />

        {/* Torso: widest at the shoulders, drawn in at the waist. */}
        <path
          fill={flesh}
          d="M 52.6 45.2 C 51.5 53.6, 53.2 62.4, 55.6 69.4 L 64.4 69.4 C 66.8 62.4, 68.5 53.6, 67.4 45.2 Z"
        />

        {/* The sash falling at his right, then the loincloth over the hips. */}
        <path
          fill={cloth}
          d="M 53 72 C 51 78, 49.4 84, 48.6 89.6 C 50.8 85, 53.4 79.6, 55.4 74.4 Z"
        />
        <path
          fill={cloth}
          d="M 53.4 67.6 C 57.4 66.2, 62.6 66.2, 66.6 67.6 L 68 77.6 C 63.6 80.2, 56.4 80.4, 52 78.2 Z"
        />

        {/* Legs, knees turned to his right. */}
        <path
          fill={flesh}
          d="M 55 77.4 C 52.2 88, 52.2 101, 54.8 115.4 L 58.5 115.8 C 58.2 101, 58.6 88, 59.3 77.4 Z"
        />
        <path
          fill={flesh}
          d="M 61 77.4 C 61.8 88, 61.9 101, 61.2 115.8 L 64.6 115.4 C 65.8 101, 65.2 88, 65 77.4 Z"
        />

        {/* Feet, one over the other. */}
        <path
          fill={flesh}
          d="M 54.4 114.4 C 57.4 112.6, 62.2 112.6, 65 114.6 L 63.6 120.8 C 60.4 122.8, 58.4 122.8, 55.6 120.8 Z"
        />
      </g>
    </g>
  );
}

export const CRUCIFIX_ASPECT = BOX_W / BOX_H;
