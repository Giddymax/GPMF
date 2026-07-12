"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FixedDepositWithClient } from "@/lib/data/admin";
import type { Approval } from "@/lib/supabase/types";
import { formatGHS } from "@/lib/utils";
import {
  approveFdEarlyWithdrawal,
  approveFdRollover,
  approveWithdrawal,
} from "@/app/admin/(dashboard)/operations/deposits/actions";

function subjectFor(a: Approval, fixedDeposits: FixedDepositWithClient[]) {
  if (a.entity_type !== "fixed_deposit") return null;
  const fd = fixedDeposits.find((f) => f.id === a.entity_id);
  return fd ? `${fd.fd_number} — ${fd.client_name}` : "Fixed deposit";
}

export function PendingApprovals({
  approvals,
  fixedDeposits = [],
}: {
  approvals: Approval[];
  fixedDeposits?: FixedDepositWithClient[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function resolve(a: Approval, approve: boolean) {
    setPending(a.id);
    const result =
      a.entity_type === "fixed_deposit"
        ? a.action === "rollover"
          ? await approveFdRollover(a.id, approve)
          : await approveFdEarlyWithdrawal(a.id, approve)
        : await approveWithdrawal(a.id, approve);
    setPending(null);
    if (result.ok) {
      toast.success(approve ? "Request approved and posted." : "Request rejected.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not resolve approval.");
    }
  }

  if (approvals.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No pending approvals.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Requested</TableHead>
          <TableHead className="text-white/50">Action</TableHead>
          <TableHead className="text-white/50">Subject</TableHead>
          <TableHead className="text-white/50">Amount</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.map((a) => (
          <TableRow key={a.id} className="border-white/5 hover:bg-white/5">
            <TableCell className="text-white/70">{new Date(a.requested_at).toLocaleString("en-GH")}</TableCell>
            <TableCell className="capitalize text-white/70">{a.action.replace("_", " ")}</TableCell>
            <TableCell className="text-white/70">{subjectFor(a, fixedDeposits) ?? "Savings withdrawal"}</TableCell>
            <TableCell className="font-medium text-white">{formatGHS(a.amount ?? 0)}</TableCell>
            <TableCell className="flex gap-2">
              <Button size="sm" disabled={pending === a.id} onClick={() => resolve(a, true)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" disabled={pending === a.id} onClick={() => resolve(a, false)}>
                Reject
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
