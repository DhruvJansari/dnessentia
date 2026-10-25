/** Lightweight SVG bar chart for the last 30 days of revenue. Hover a bar for its value. */
export function RevenueChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const W = 600;
  const H = 180;
  const gap = 4;
  const barW = (W - gap * (data.length - 1)) / data.length;
  const label = (day: string) =>
    new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img" aria-label="Revenue over the last 30 days">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="#ece8e1" strokeDasharray="3 4" />
        ))}
        {data.map((d, i) => {
          const h = d.revenue ? Math.max(3, (d.revenue / max) * (H - 8)) : 2;
          const x = i * (barW + gap);
          return (
            <g key={d.day} className="group">
              <rect x={x} y={0} width={barW} height={H} fill="transparent" />
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={h}
                rx={Math.min(4, barW / 2)}
                className={`transition-colors ${d.revenue ? "fill-[#cfae6e] group-hover:fill-[#a6803d]" : "fill-[#ece8e1]"}`}
              >
                <title>{`${label(d.day)}: ₹${d.revenue.toLocaleString("en-IN")} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}</title>
              </rect>
              {(i === data.length - 1 || (i % 7 === 0 && i < data.length - 4)) && (
                <text x={x + barW / 2} y={H + 18} textAnchor="middle" className="fill-stone-400 text-[11px]">
                  {label(d.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
