import { cn } from "@/lib/utils";

export function RatioGauge({
  label,
  value,
  benchmark,
  format = "percent",
  higherIsBetter = true,
  cap,
}: {
  label: string;
  value: number | null;
  benchmark: number;
  format?: "percent" | "ratio";
  higherIsBetter?: boolean;
  /** Visual scale ceiling for the bar; defaults to benchmark * 1.6. */
  cap?: number;
}) {
  const scaleCap = cap ?? benchmark * 1.6;
  const pct = value === null ? 0 : Math.min(Math.max(value / scaleCap, 0), 1) * 100;
  const benchmarkPct = Math.min(benchmark / scaleCap, 1) * 100;
  const meets = value !== null && (higherIsBetter ? value >= benchmark : value <= benchmark);

  const displayValue =
    value === null ? "—" : format === "percent" ? `${(value * 100).toFixed(1)}%` : value.toFixed(2) + "x";
  const displayBenchmark = format === "percent" ? `${(benchmark * 100).toFixed(0)}%` : `${benchmark.toFixed(2)}x`;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</p>
        <p className={cn("font-heading text-lg font-semibold", meets ? "text-emerald-500" : "text-gold-500")}>
          {displayValue}
        </p>
      </div>
      <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all", meets ? "bg-emerald-500" : "bg-gradient-gold")}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-white/60"
          style={{ left: `${benchmarkPct}%` }}
          title={`Benchmark: ${displayBenchmark}`}
        />
      </div>
      <p className="mt-1 text-[11px] text-white/40">Benchmark {displayBenchmark}</p>
    </div>
  );
}
