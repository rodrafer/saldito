'use client';

import { useState, type ReactNode } from 'react';

export interface DonutSegment {
  name: string;
  color: string;
  /** Percentage 0–100. */
  pct: number;
  /** Already-formatted amount, for the tooltip. */
  amount?: string;
}

/** Radius and circumference in viewBox units. The viewBox is 100 wide. */
const R = 40;
const CIRC = 2 * Math.PI * R;

/**
 * These two mirror `--sd-donut-grosor` and `--sd-donut-gap` in tokens.css.
 *
 * They can't read the tokens the way the colours do: both feed the
 * `stroke-dasharray` arithmetic below, which runs during render, and pulling a
 * custom property out of the cascade needs a mounted element — so the server
 * and the client would disagree on the first paint. Keeping them here means
 * the numbers live in two files; changing one without the other is the bug to
 * watch for.
 */
export const DONUT_THICKNESS = 11;
export const DONUT_GAP = 17;

interface Arc {
  dash: number;
  offset: number;
}

/**
 * Turns percentages into `stroke-dasharray` / `stroke-dashoffset` pairs.
 *
 * Each arc is shortened by the gap and shifted half a gap forward, so the space
 * ends up split evenly between neighbours instead of all of it landing on one
 * side. The 0.6 floor keeps a rounded cap visible for a segment too small to
 * survive the subtraction — without it, tiny categories vanish.
 *
 * Lives outside the component so the running total stays a local, not a
 * variable being mutated mid-render.
 */
function toArcs(segments: DonutSegment[]): Arc[] {
  const arcs: Arc[] = [];
  let travelled = 0;
  for (const segment of segments) {
    const length = CIRC * (segment.pct / 100);
    arcs.push({
      dash: Math.max(length - DONUT_GAP, 0.6),
      offset: -(travelled + DONUT_GAP / 2),
    });
    travelled += length;
  }
  return arcs;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Donut side in px. 72 on mobile cards, 88 on desktop. */
  size?: number;
  /** Ring thickness in viewBox units. */
  thickness?: number;
  /** Tooltip footer: period or scope of the data ("Julio 2026 · filtrado"). */
  period?: string;
  center?: ReactNode;
}

/**
 * SVG donut: one `circle` per segment with `stroke-dasharray` and
 * `stroke-linecap: round`, separated from each other — not a conic-gradient.
 * On hover the segment thickens and the rest dim, with a tooltip carrying
 * category, amount, percentage and period.
 *
 * The inner hub with its radial gradient and the ring's shadow are what give
 * it depth: don't remove them.
 */
export function DonutChart({
  segments,
  size = 88,
  thickness = DONUT_THICKNESS,
  period,
  center,
}: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered !== null ? segments[hovered] : null;
  const arcs = toArcs(segments);

  return (
    <div style={{ width: size, height: size, flex: 'none', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: '18%',
          borderRadius: '50%',
          background: 'var(--sd-donut-hub)',
          boxShadow: 'var(--sd-sh-donut-hub)',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        {center}
      </div>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={segments.map((s) => `${s.name} ${s.pct}%`).join(', ')}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'block',
          overflow: 'visible',
          filter: 'var(--sd-sh-donut)',
        }}
      >
        <circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          stroke="var(--sd-surface)"
          strokeWidth={thickness}
        />
        {segments.map((segment, i) => {
          const { dash, offset } = arcs[i];
          const isActive = hovered === i;
          return (
            <circle
              key={segment.name}
              cx={50}
              cy={50}
              r={R}
              fill="none"
              stroke={segment.color}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                cursor: 'pointer',
                transition: 'opacity .18s ease, stroke-width .18s ease',
                strokeWidth: isActive ? thickness + 3 : thickness,
                opacity: hovered === null || isActive ? 1 : 0.26,
              }}
            />
          );
        })}
      </svg>
      {active && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 'calc(100% + 10px)',
            background: 'var(--sd-surface-elevada)',
            border: '1px solid var(--sd-border-fuerte)',
            borderRadius: 'var(--sd-r-sm)',
            padding: '8px 11px',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--sd-sh-dropdown)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 'var(--sd-fs-caption)',
              fontWeight: 'var(--sd-fw-bold)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: active.color,
                flex: 'none',
              }}
            />
            {active.name}
          </div>
          <div
            style={{
              fontSize: 'var(--sd-fs-caption)',
              fontWeight: 'var(--sd-fw-bold)',
              color: 'var(--sd-dorado)',
              marginTop: 3,
            }}
          >
            {active.amount ? `${active.amount} · ` : ''}
            {active.pct}%
          </div>
          {period && (
            <div
              style={{
                fontSize: 'var(--sd-fs-micro)',
                color: 'var(--sd-text-atenuado)',
                marginTop: 2,
              }}
            >
              {period}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
