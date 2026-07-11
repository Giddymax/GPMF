"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TrendPoint {
  date: string;
  [key: string]: string | number | null;
}

export function RatioTrendChart({
  data,
  series,
}: {
  data: TrendPoint[];
  series: { key: string; color: string; label: string }[];
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-white/40">No monthly snapshots yet — the EOM close job populates this chart.</p>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
          <YAxis
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            stroke="rgba(255,255,255,0.4)"
            fontSize={11}
            width={40}
          />
          <Tooltip
            formatter={(value) => `${(Number(value ?? 0) * 100).toFixed(1)}%`}
            contentStyle={{ background: "#112239", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
