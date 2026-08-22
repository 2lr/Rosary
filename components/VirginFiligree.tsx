import { cx } from '@/components/ui';

/**
 * A figure of the Virgin behind the prayer, in filigree.
 *
 * It is drawn in the palette's own chain colour at a few percent opacity, so it
 * is nearer to a watermark in the paper than to a picture: present when you look
 * for it, gone when you are reading. What it does is breathe — brightening and
 * fading once through, on a slow rise and fall.
 *
 * The breath is keyed to the prayer rather than to the clock: give the element a
 * `key` that changes with the step and the animation begins again, so each Hail
 * Mary and each Our Father gets one rise and one fall of its own. That is the
 * rhythm — the beads are counted by the hand, and this is what the eye counts.
 *
 * On the drawing, which took several goes. An enclosing almond made the whole
 * thing an arrow — pointed at the top and no wider than the shoulders. A full
 * standing figure made a tent, because at this size the veil can never widen
 * enough to read as a body. What works is a bust, cropped at the chest the way
 * a medal is: the head small inside a halo that is plainly wider, and shoulders
 * plainly wider again, running off the bottom edge.
 *
 * Under `prefers-reduced-motion` the global rule collapses the animation to its
 * final frame, which is why the first and last frames are the resting opacity
 * rather than nothing: it settles to a still filigree instead of disappearing.
 */

/** Twelve stars, the crown of the woman in Revelation, over the top of the halo. */
const STARS = Array.from({ length: 12 }, (_, i) => {
  // Spread across the upper arc, from one shoulder round to the other.
  const angle = Math.PI + (i / 11) * Math.PI;
  return { x: 100 + Math.cos(angle) * 58, y: 88 + Math.sin(angle) * 58 };
});

export default function VirginFiligree({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      aria-hidden
      focusable="false"
      className={cx('pointer-events-none select-none', className)}
      fill="none"
      stroke="var(--bloom-chain)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The halo, wider than the veil so it reads as a ring behind the head. */}
      <circle cx="100" cy="88" r="46" strokeWidth="1" />

      {/* The veil, over the head and out to shoulders plainly wider than it. */}
      <path d="M100 42 C 77 42, 63 62, 62 88 C 61 112, 55 132, 44 150 C 30 174, 20 208, 16 240 L 184 240 C 180 208, 170 174, 156 150 C 145 132, 139 112, 138 88 C 137 62, 123 42, 100 42 Z" />

      {/* The face the veil frames. */}
      <ellipse cx="100" cy="92" rx="17" ry="20" />

      {/* The veil's inner edge, falling from the crown past the temples. */}
      <path d="M100 51 C 81 51, 71 69, 70 91 C 69 113, 64 130, 55 146" strokeWidth="1" />
      <path d="M100 51 C 119 51, 129 69, 130 91 C 131 113, 136 130, 145 146" strokeWidth="1" />

      {/* The mantle falling open at the neck. */}
      <path d="M72 150 C 84 174, 116 174, 128 150" strokeWidth="1" />

      {STARS.map((star, i) => (
        <circle key={i} cx={star.x} cy={star.y} r="1.9" fill="var(--bloom-chain)" stroke="none" />
      ))}
    </svg>
  );
}
