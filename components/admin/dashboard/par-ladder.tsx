import { cn, formatGHS } from "@/lib/utils";
import type { ParBucket } from "@/lib/finance";

const BUCKET_ORDER: ParBucket[] = ["current", "1-30", "31-90", "90+"];
const BUCKET_LABEL: Record<ParBucket, string> = {
  current: "Current",
  "1-30": "1–30 days",
  "31-90": "31–90 days",
  "90+": "90+ days",
};
const BUCKET_COLOR: Record<ParBucket, string> = {
  current: "bg-emerald-500",
  "1-30": "bg-gold-500",
  "31-90": "bg-orange-500",
  "90+": "bg-danger-500",
};

export function ParLadder({ buckets }: { buckets: Record<ParBucket, number> }) {
  const total = BUCKET_ORDER.reduce((sum, b) => sum + buckets[b], 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
        {BUCKET_ORDER.map((b) => {
          const pct = total === 0 ? (b === "current" ? 100 : 0) : (buckets[b] / total) * 100;
          if (pct === 0) return null;
          return <div key={b} className={cn("h-full", BUCKET_COLOR[b])} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUCKET_ORDER.map((b) => (
          <div key={b}>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <span className={cn("size-2 rounded-full", BUCKET_COLOR[b])} />
              {BUCKET_LABEL[b]}
            </div>
            <p className="mt-1 font-heading text-sm font-semibold text-white">{formatGHS(buckets[b])}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
