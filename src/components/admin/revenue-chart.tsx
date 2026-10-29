"use client";

import { useMemo, useRef, useState } from "react";

type Point = { day: string; revenue: number; orders: number };

/* Single-series revenue chart. One hue (validated: chroma + contrast on white), no legend (the card title names
   the series), orders shown in the tooltip rather than on a second axis. Columns up to 31 days, line beyond. */
const HUE = "#b07a1f";
const W = 720;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 48 };

const inrCompact = (n: number) =>
  n >= 1e5 ? `₹${(n / 1e5).toFixed(n % 1e5 ? 1 : 0)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(n % 1e3 ? 1 : 0)}K` : `₹${n}`;
const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", opts);

/** Rounds the axis max up to a clean step so ticks read 0 / 500 / 1K / 1.5K… */
function niceMax(max: number) {
  if (max <= 0) return 1000;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => max / s <= 4) ?? pow * 10;
  return Math.ceil(max / step) * step;
}

export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const asBars = data.length <= 31;
  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.revenue))), [data]);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(24, Math.max(4, slot - 4));
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelEvery = data.length <= 7 ? 1 : data.length <= 31 ? 7 : 15;
  const hasData = data.some((d) => d.revenue > 0);

  const linePath = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.floor((px - PAD.left) / slot);
    setHover(i >= 0 && i < data.length ? i : null);
  }

  const active = hover != null ? data[hover] : null;
  const tipLeft = hover != null ? (x(hover) / W) * 100 : 0;

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label={`Daily revenue for the last ${data.length} days`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#eeebe6" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-stone-400 text-[11px] tabular-nums">
                {inrCompact(t)}
              </text>
            </g>
          ))}

          {asBars ? (
            data.map((d, i) => {
              const h = Math.max(0, y(0) - y(d.revenue));
              const r = Math.min(4, h, barW / 2);
              const bx = x(i) - barW / 2;
              const by = y(d.revenue);
              // 4px rounded data-end, square at the baseline.
              const path = h
                ? `M${bx},${y(0)} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + barW - r} Q${bx + barW},${by} ${bx + barW},${by + r} V${y(0)} Z`
                : "";
              return (
                <g key={d.day}>
                  {hover === i && <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="#f6f1e9" />}
                  {path && <path d={path} fill={HUE} opacity={hover == null || hover === i ? 1 : 0.45} className="transition-opacity" />}
                </g>
              );
            })
          ) : (
            <>
              <path d={areaPath} fill={HUE} opacity={0.1} />
              <path d={linePath} fill="none" stroke={HUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {hover != null && (
                <>
                  <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="#d6d0c6" strokeWidth={1} />
                  <circle cx={x(hover)} cy={y(data[hover].revenue)} r={5} fill={HUE} stroke="#fff" strokeWidth={2} />
                </>
              )}
            </>
          )}

          <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#d6d0c6" strokeWidth={1} />
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              (i === data.length - 1 || data.length - 1 - i >= labelEvery / 2) && (
                <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" className="fill-stone-400 text-[11px]">
                  {dayLabel(d.day)}
                </text>
              )
            ) : null,
          )}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 py-2 text-[12px] shadow-lg"
            style={{ left: `${Math.min(88, Math.max(12, tipLeft))}%` }}
            role="status"
          >
            <p className="font-medium text-stone-900">{dayLabel(active.day, { weekday: "short", day: "numeric", month: "short" })}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-stone-700">
              <span className="size-2 rounded-sm" style={{ background: HUE }} />₹{active.revenue.toLocaleString("en-IN")}
            </p>
            <p className="text-stone-500">
              {active.orders} order{active.orders === 1 ? "" : "s"}
            </p>
          </div>
        )}
        {!hasData && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-stone-400">No paid orders in this period yet</p>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-[12px] text-stone-500 hover:text-stone-800">View as table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-[0.04em] text-stone-500">
              <tr>
                <th className="py-1.5 font-medium">Day</th>
                <th className="py-1.5 text-right font-medium">Orders</th>
                <th className="py-1.5 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="py-1.5">{dayLabel(d.day, { weekday: "short", day: "numeric", month: "short" })}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.orders}</td>
                  <td className="py-1.5 text-right tabular-nums">₹{d.revenue.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
