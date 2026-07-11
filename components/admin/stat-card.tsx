import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  className?: string;
}) {
  return (
    <Card className={cn("border-white/10 bg-navy-800", className)}>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</p>
        <p
          className={cn(
            "mt-2 font-heading text-2xl font-semibold",
            tone === "positive" && "text-emerald-500",
            tone === "negative" && "text-danger-500",
            tone === "warning" && "text-gold-500",
            tone === "default" && "text-white"
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-white/50">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
