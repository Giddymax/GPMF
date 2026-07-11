import { cn, formatGHS } from "@/lib/utils";

export interface AlmRow {
  bucket: string;
  assets: number;
  liabilities: number;
}

export function AlmTable({ rows }: { rows: AlmRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
            <th className="py-2 pr-4">Bucket</th>
            <th className="py-2 pr-4 text-right">Assets maturing</th>
            <th className="py-2 pr-4 text-right">Liabilities maturing</th>
            <th className="py-2 text-right">Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const gap = row.assets - row.liabilities;
            return (
              <tr key={row.bucket} className="border-b border-white/5">
                <td className="py-2.5 pr-4 font-medium text-white">{row.bucket}</td>
                <td className="py-2.5 pr-4 text-right text-white/80">{formatGHS(row.assets)}</td>
                <td className="py-2.5 pr-4 text-right text-white/80">{formatGHS(row.liabilities)}</td>
                <td className={cn("py-2.5 text-right font-semibold", gap >= 0 ? "text-emerald-500" : "text-danger-500")}>
                  {formatGHS(gap)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
