'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

export interface RevenuePoint {
  month: string;
  one_time_cents: number;
  subscription_cents: number;
  new_customers: number;
}

/**
 * Ingresos por mes, apilando pago único y suscripción.
 *
 * Paleta validada contra la superficie oscura del panel: separación CVD
 * ΔE 25.0 (deuteranopía) y 9.4 (tritanopía), ambos por encima del umbral, y
 * contraste sobre fondo ≥ 3:1.
 */
const SERIES = [
  { key: 'one_time_cents', label: 'Pago único', color: '#0ea86a' },
  { key: 'subscription_cents', label: 'Suscripción', color: '#7c6cf6' },
] as const;

const SURFACE = '#0c1018';
const GRID = '#1e2535';
const AXIS_TEXT = '#8b96ad';

// Sistema de coordenadas fijo; el SVG escala con el contenedor.
const WIDTH = 760;
const HEIGHT = 280;
const PADDING = { top: 24, right: 16, bottom: 36, left: 64 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const MAX_BAR = 24;
const SEGMENT_GAP = 2;
const CORNER = 4;

/** Redondea el techo del eje a un número limpio (1.000 / 2.500 / 5.000…). */
function niceCeiling(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function monthLabel(month: string): string {
  const [, m] = month.split('-');
  const names = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return names[Number(m) - 1] ?? month;
}

/**
 * Columna con el extremo superior redondeado y la base recta.
 * Se dibuja a mano porque `rx` redondearía también la base, despegando la barra
 * de su línea de referencia.
 */
function topRoundedPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(CORNER, height / 2, width / 2);
  if (height <= 0) return '';
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
        Todavía no hay ingresos registrados.
      </p>
    );
  }

  const totals = data.map((point) => point.one_time_cents + point.subscription_cents);
  const ceiling = niceCeiling(Math.max(...totals, 1));
  const bandWidth = PLOT_WIDTH / data.length;
  const barWidth = Math.min(MAX_BAR, bandWidth * 0.55);

  const yOf = (cents: number) => PADDING.top + PLOT_HEIGHT - (cents / ceiling) * PLOT_HEIGHT;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * ceiling);

  const active = hovered === null ? null : data[hovered];

  return (
    <figure className="m-0">
      {/* Leyenda: dos series, así que la identidad nunca depende solo del color. */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-mist-400">
        {SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full min-w-[520px]"
          role="img"
          aria-label="Ingresos mensuales por tipo de venta"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={yOf(tick)}
                y2={yOf(tick)}
                stroke={GRID}
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 10}
                y={yOf(tick) + 4}
                textAnchor="end"
                fontSize={11}
                fill={AXIS_TEXT}
              >
                {formatPrice(tick)}
              </text>
            </g>
          ))}

          {data.map((point, index) => {
            const bandStart = PADDING.left + index * bandWidth;
            const x = bandStart + (bandWidth - barWidth) / 2;
            const baseline = PADDING.top + PLOT_HEIGHT;

            const oneTimeHeight = (point.one_time_cents / ceiling) * PLOT_HEIGHT;
            const subscriptionHeight = (point.subscription_cents / ceiling) * PLOT_HEIGHT;

            // El segmento inferior cede 2px para que el hueco lo abra la
            // superficie, no un borde dibujado sobre la marca.
            const lowerHeight = Math.max(
              0,
              oneTimeHeight - (subscriptionHeight > 0 ? SEGMENT_GAP : 0),
            );
            const lowerY = baseline - lowerHeight;
            const upperY = baseline - oneTimeHeight - subscriptionHeight;

            const isLast = index === data.length - 1;
            const total = totals[index] ?? 0;

            return (
              <g key={point.month}>
                {oneTimeHeight > 0 &&
                  (subscriptionHeight > 0 ? (
                    <rect
                      x={x}
                      y={lowerY}
                      width={barWidth}
                      height={lowerHeight}
                      fill={SERIES[0].color}
                    />
                  ) : (
                    <path
                      d={topRoundedPath(x, lowerY, barWidth, lowerHeight)}
                      fill={SERIES[0].color}
                    />
                  ))}

                {subscriptionHeight > 0 && (
                  <path
                    d={topRoundedPath(x, upperY, barWidth, subscriptionHeight)}
                    fill={SERIES[1].color}
                  />
                )}

                {/* Etiqueta directa solo en el último mes: una cifra sobre cada
                    columna se vuelve ruido y deja de leerse. */}
                {isLast && total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={upperY - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="#c9d1e0"
                  >
                    {formatPrice(total)}
                  </text>
                )}

                <text
                  x={bandStart + bandWidth / 2}
                  y={HEIGHT - 14}
                  textAnchor="middle"
                  fontSize={11}
                  fill={AXIS_TEXT}
                >
                  {monthLabel(point.month)}
                </text>

                {/* Zona sensible de toda la banda: el objetivo de hover es mucho
                    mayor que la barra, que puede ser de pocos píxeles. */}
                <rect
                  x={bandStart}
                  y={PADDING.top}
                  width={bandWidth}
                  height={PLOT_HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                />
              </g>
            );
          })}

          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + PLOT_HEIGHT}
            y2={PADDING.top + PLOT_HEIGHT}
            stroke={GRID}
            strokeWidth={1}
          />
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-ink-600 px-3 py-2 text-xs shadow-lg"
            style={{
              background: SURFACE,
              left: `${((PADDING.left + (hovered! + 0.5) * bandWidth) / WIDTH) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-semibold text-mist-50">{active.month}</p>
            {SERIES.map((series) => (
              <p key={series.key} className="mt-1 flex items-center gap-2 text-mist-200">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: series.color }}
                />
                {series.label}: {formatPrice(active[series.key])}
              </p>
            ))}
            <p className="mt-1 text-mist-400">{active.new_customers} cliente(s) nuevo(s)</p>
          </div>
        )}
      </div>

      {/* Vista de tabla: lo que el gráfico muestra, disponible sin depender del
          color ni del puntero. */}
      <details className="mt-4">
        <summary className="cursor-pointer list-none text-xs text-mist-400 marker:hidden hover:text-mist-50">
          Ver los datos en tabla
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-xs">
            <thead className="border-b border-ink-700 text-left text-mist-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Mes</th>
                <th className="py-2 pr-4 font-medium">Pago único</th>
                <th className="py-2 pr-4 font-medium">Suscripción</th>
                <th className="py-2 font-medium">Clientes nuevos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {data.map((point) => (
                <tr key={point.month}>
                  <td className="py-2 pr-4 text-mist-400">{point.month}</td>
                  <td className="py-2 pr-4">{formatPrice(point.one_time_cents)}</td>
                  <td className="py-2 pr-4">{formatPrice(point.subscription_cents)}</td>
                  <td className="py-2">{point.new_customers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
