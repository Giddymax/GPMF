import { AlertTriangle, CheckCircle2 } from "lucide-react";

export interface Alert {
  message: string;
  severity: "warning" | "critical";
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-500">
        <CheckCircle2 className="size-4" />
        No active alerts — all guardrails within range.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, i) => (
        <li
          key={i}
          className={
            "flex items-start gap-2 rounded-md border px-3 py-2 text-sm " +
            (alert.severity === "critical"
              ? "border-danger-500/30 bg-danger-500/10 text-danger-500"
              : "border-gold-500/30 bg-gold-500/10 text-gold-500")
          }
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {alert.message}
        </li>
      ))}
    </ul>
  );
}
