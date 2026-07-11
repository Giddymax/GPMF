"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cycleCommission, cyclePayout } from "@/lib/finance";
import type { SusuCycleWithClient } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";
import { processSusuPayout, rolloverSusuCycle } from "@/app/admin/(dashboard)/operations/susu/actions";

export function PayoutQueue({ cycles }: { cycles: SusuCycleWithClient[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function payout(cycle: SusuCycleWithClient) {
    if (!cycle.agent_id) {
      toast.error("This client has no assigned agent.");
      return;
    }
    setPending(cycle.id);
    const result = await processSusuPayout(cycle.id, cycle.agent_id);
    setPending(null);
    if (result.ok) {
      toast.success(`Paid out ${cycle.client_name}'s cycle.`);
      router.refresh();
    } else {
      toast.error(result.error || "Payout failed.");
    }
  }

  async function rollover(cycle: SusuCycleWithClient) {
    setPending(cycle.id);
    const result = await rolloverSusuCycle(cycle.id);
    setPending(null);
    if (result.ok) {
      toast.success(`Rolled over ${cycle.client_name}'s cycle.`);
      router.refresh();
    } else {
      toast.error(result.error || "Rollover failed.");
    }
  }

  if (cycles.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No completed cycles awaiting payout.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Client</TableHead>
          <TableHead className="text-white/50">Days paid</TableHead>
          <TableHead className="text-white/50">Commission</TableHead>
          <TableHead className="text-white/50">Payout</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {cycles.map((cycle) => {
          const payoutAmount = cyclePayout(cycle.daily_amount, cycle.days_paid);
          const commission = cycleCommission(cycle.daily_amount, cycle.days_paid);
          return (
            <TableRow key={cycle.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-white">
                {cycle.client_name}
                <p className="text-xs text-white/40">{cycle.client_code}</p>
              </TableCell>
              <TableCell className="text-white/70">{cycle.days_paid} / 31</TableCell>
              <TableCell className="text-white/70">{formatGHS(commission)}</TableCell>
              <TableCell className="font-semibold text-emerald-500">{formatGHS(payoutAmount)}</TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" disabled={pending === cycle.id} onClick={() => payout(cycle)}>
                  Pay out
                </Button>
                <Button size="sm" variant="outline" disabled={pending === cycle.id} onClick={() => rollover(cycle)}>
                  Roll over
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
