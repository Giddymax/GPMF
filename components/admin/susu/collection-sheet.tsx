"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SusuCycleWithClient } from "@/lib/data/admin";
import {
  getQueuedContributions,
  queueContribution,
  removeQueuedContribution,
  type QueuedContribution,
} from "@/lib/offline/susu-queue";
import { formatGHS } from "@/lib/utils";
import { recordSusuContribution } from "@/app/admin/(dashboard)/operations/susu/actions";

function isMissedYesterday(lastCollected: string | null) {
  if (!lastCollected) return true;
  const diffDays = (Date.now() - new Date(lastCollected).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 2;
}

export function CollectionSheet({ cycles }: { cycles: SusuCycleWithClient[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState<string | null>(null);
  const [queued, setQueued] = React.useState<QueuedContribution[]>([]);
  const [syncing, setSyncing] = React.useState(false);

  const refreshQueue = React.useCallback(async () => {
    try {
      setQueued(await getQueuedContributions());
    } catch {
      // IndexedDB unavailable (e.g. private browsing) — offline queue simply won't be offered.
    }
  }, []);

  const flushQueue = React.useCallback(async () => {
    setSyncing(true);
    const items = await getQueuedContributions().catch(() => []);
    for (const item of items) {
      const result = await recordSusuContribution(item.cycleId, item.agentId, item.amount).catch(() => ({ ok: false as const }));
      if (result.ok) {
        await removeQueuedContribution(item.id);
      }
    }
    setSyncing(false);
    await refreshQueue();
    router.refresh();
  }, [refreshQueue, router]);

  React.useEffect(() => {
    refreshQueue();
    window.addEventListener("online", flushQueue);
    return () => window.removeEventListener("online", flushQueue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function record(cycle: SusuCycleWithClient) {
    const amount = Number(amounts[cycle.id] ?? cycle.daily_amount);
    if (!cycle.agent_id) {
      toast.error("This client has no assigned agent.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueContribution({ cycleId: cycle.id, agentId: cycle.agent_id, amount, clientName: cycle.client_name });
      toast.info(`Offline — queued ${formatGHS(amount)} for ${cycle.client_name}. Will sync automatically.`);
      refreshQueue();
      return;
    }

    setPending(cycle.id);
    try {
      const result = await recordSusuContribution(cycle.id, cycle.agent_id, amount);
      if (result.ok) {
        toast.success(`Recorded ${formatGHS(amount)} for ${cycle.client_name}`);
        router.refresh();
      } else {
        toast.error(result.error || "Could not record collection.");
      }
    } catch {
      await queueContribution({ cycleId: cycle.id, agentId: cycle.agent_id, amount, clientName: cycle.client_name });
      toast.info(`Connection failed — queued ${formatGHS(amount)} for ${cycle.client_name} for later sync.`);
      refreshQueue();
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      {queued.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gold-500/10 px-4 py-3 text-sm text-gold-500">
          <span className="flex items-center gap-2">
            <CloudOff className="size-4" /> {queued.length} collection{queued.length === 1 ? "" : "s"} queued offline
          </span>
          <Button size="sm" variant="outline" disabled={syncing} onClick={flushQueue}>
            <RefreshCw className={syncing ? "size-3.5 animate-spin" : "size-3.5"} /> Sync now
          </Button>
        </div>
      ) : null}

      {cycles.length === 0 ? (
        <p className="p-8 text-center text-sm text-white/40">No active susu cycles.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Client</TableHead>
              <TableHead className="text-white/50">Cycle</TableHead>
              <TableHead className="text-white/50">Days paid</TableHead>
              <TableHead className="text-white/50">Amount</TableHead>
              <TableHead className="text-white/50" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.map((cycle) => (
              <TableRow key={cycle.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-white">
                  <div className="flex items-center gap-2">
                    {cycle.client_name}
                    {isMissedYesterday(cycle.last_collected_at) ? (
                      <span title="Missed a day">
                        <AlertCircle className="size-3.5 text-gold-500" />
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-white/40">{cycle.client_code}</p>
                </TableCell>
                <TableCell className="text-white/70">Day {cycle.days_paid} of 31</TableCell>
                <TableCell>
                  <Badge variant={cycle.days_paid >= 15 ? "emerald" : "muted"}>{cycle.days_paid} paid</Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-28"
                    value={amounts[cycle.id] ?? String(cycle.daily_amount)}
                    onChange={(e) => setAmounts((a) => ({ ...a, [cycle.id]: e.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <Button size="sm" disabled={pending === cycle.id} onClick={() => record(cycle)}>
                    {pending === cycle.id ? "Recording…" : "Record"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
