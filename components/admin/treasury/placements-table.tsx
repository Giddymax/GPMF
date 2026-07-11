"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TransactionActions } from "@/components/admin/ledger/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TreasuryPlacement } from "@/lib/supabase/types";
import { formatGHS } from "@/lib/utils";
import { matureTreasuryPlacement } from "@/app/admin/(dashboard)/operations/treasury/actions";

export function PlacementsTable({ placements }: { placements: TreasuryPlacement[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function mature(id: string) {
    setPending(id);
    const result = await matureTreasuryPlacement(id);
    setPending(null);
    if (result.ok) {
      toast.success("Placement matured and interest posted.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not mature placement.");
    }
  }

  if (placements.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No treasury placements yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Instrument</TableHead>
          <TableHead className="text-white/50">Principal</TableHead>
          <TableHead className="text-white/50">Rate</TableHead>
          <TableHead className="text-white/50">Maturity</TableHead>
          <TableHead className="text-white/50">Status</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {placements.map((p) => (
          <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
            <TableCell className="text-white">{p.instrument}</TableCell>
            <TableCell className="text-white/70">{formatGHS(p.principal)}</TableCell>
            <TableCell className="text-white/70">{(p.annual_rate * 100).toFixed(1)}%</TableCell>
            <TableCell className="text-white/70">{new Date(p.maturity_date).toLocaleDateString("en-GH")}</TableCell>
            <TableCell>
              <Badge variant={p.status === "active" ? "emerald" : "muted"} className="capitalize">{p.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                {p.status === "active" ? (
                  <Button size="sm" disabled={pending === p.id} onClick={() => mature(p.id)}>
                    Mature now
                  </Button>
                ) : null}
                {p.ledger_transaction_id ? (
                  <TransactionActions transactionId={p.ledger_transaction_id} label={`${p.instrument} placement`} amount={p.principal} />
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
