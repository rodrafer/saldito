'use client';
import { useState } from 'react';

export interface Segmento {
  nombre: string;
  color: string;
  /** Porcentaje 0–100. */
  pct: number;
  /** Monto ya formateado, para el tooltip. */
  monto?: string;
}

export interface DonutChartProps {
  segmentos: Segmento[];
  /** Lado del donut en px. 72 en tarjetas mobile, 88 en desktop. */
  tamano?: number;
  /** Espesor del anillo en unidades del viewBox de 100. */
  grosor?: number;
  /** Pie del tooltip: período o alcance del dato ("Julio 2026 · filtrado"). */
  periodo?: string;
  centro?: React.ReactNode;
}

const R = 40;
const CIRC = 2 * Math.PI * R;
/** Separación entre segmentos, en unidades de arco del viewBox. */
const GAP = 17;

/**
 * Donut en SVG: un `circle` por segmento con `stroke-dasharray` y
 * `stroke-linecap: round`, separados entre sí — no es un conic-gradient.
 * Al pasar el mouse el segmento engorda y los demás se atenúan, con
 * tooltip de categoría, monto, porcentaje y período.
 *
 * El hub interior con degradado radial y la sombra del anillo son los que
 * dan profundidad: no quitarlos.
 */
export function DonutChart({ segmentos, tamano = 88, grosor = 11, periodo, centro }: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  let acc = 0;
  const hv = hover !== null ? segmentos[hover] : null;

  return (
    <div style={{ width: tamano, height: tamano, flex: 'none', position: 'relative' }}>
      <div
        style={{
          position: 'absolute', inset: '18%', borderRadius: '50%',
          background: 'radial-gradient(circle at 34% 28%, #24222A 0%, #1A181E 55%, #131217 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,.6), inset 0 1px 4px rgba(0,0,0,.8)',
          display: 'grid', placeItems: 'center', textAlign: 'center',
        }}
      >
        {centro}
      </div>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={segmentos.map((s) => `${s.nombre} ${s.pct}%`).join(', ')}
        style={{
          position: 'relative', width: '100%', height: '100%', display: 'block',
          overflow: 'visible', filter: 'drop-shadow(0 4px 9px rgba(0,0,0,.55))',
        }}
      >
        <circle cx={50} cy={50} r={R} fill="none" stroke="var(--sd-surface)" strokeWidth={grosor} />
        {segmentos.map((s, i) => {
          const largo = CIRC * (s.pct / 100);
          const dash = Math.max(largo - GAP, 0.6);
          const offset = -(acc + GAP / 2);
          acc += largo;
          const activo = hover === i;
          return (
            <circle
              key={s.nombre}
              cx={50}
              cy={50}
              r={R}
              fill="none"
              stroke={s.color}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                cursor: 'pointer',
                transition: 'opacity .18s ease, stroke-width .18s ease',
                strokeWidth: activo ? grosor + 3 : grosor,
                opacity: hover === null || activo ? 1 : 0.26,
              }}
            />
          );
        })}
      </svg>
      {hv && (
        <div
          style={{
            position: 'absolute', left: 0, bottom: 'calc(100% + 10px)',
            background: 'var(--sd-surface-elevada)', border: '1px solid var(--sd-border-fuerte)',
            borderRadius: 'var(--sd-r-sm)', padding: '8px 11px', whiteSpace: 'nowrap',
            boxShadow: 'var(--sd-sh-dropdown)', zIndex: 8, pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--sd-fs-caption)', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hv.color, flex: 'none' }} />
            {hv.nombre}
          </div>
          <div style={{ fontSize: 'var(--sd-fs-caption)', fontWeight: 700, color: 'var(--sd-dorado)', marginTop: 3 }}>
            {hv.monto ? `${hv.monto} · ` : ''}{hv.pct}%
          </div>
          {periodo && (
            <div style={{ fontSize: 'var(--sd-fs-micro)', color: 'var(--sd-text-atenuado)', marginTop: 2 }}>{periodo}</div>
          )}
        </div>
      )}
    </div>
  );
}
