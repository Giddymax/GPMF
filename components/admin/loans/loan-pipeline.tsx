"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LoanWithParty } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";
import { appraiseLoan, approveLoan, disburseLoan, rejectLoan } from "@/app/admin/(dashboard)/operations/loans/actions";

const STATUS_VARIANT: Record<string, "muted" | "gold" | "emerald" | "destructive"> = {
  pending: "muted",
  appraisal: "gold",
  approved: "gold",
  disbursed: "emerald",
  closed: "muted",
  written_off: "destructive",
  rejected: "destructive",
};

export function LoanPipeline({ loans }: { loans: LoanWithParty[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, id: string) {
    setPending(id);
    const result = await action();
    setPending(null);
    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error || "Action failed.");
    }
  }

  if (loans.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No loans in this view.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Loan</TableHead>
          <TableHead className="text-white/50">Client / group</TableHead>
          <TableHead className="text-white/50">Principal</TableHead>
          <TableHead className="text-white/50">Status</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => (
          <TableRow key={loan.id} className="border-white/5 hover:bg-white/5">
            <TableCell>
              <Link href={`/admin/operations/loans/${loan.id}`} className="font-medium text-white hover:text-gold-500">
                {loan.loan_number}
              </Link>
            </TableCell>
            <TableCell className="text-white/70">{loan.party_name}</TableCell>
            <TableCell className="text-white/70">{formatGHS(loan.principal)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[loan.status] ?? "muted"} className="capitalize">{loan.status}</Badge>
            </TableCell>
            <TableCell className="flex flex-wrap gap-2">
              {loan.status === "pending" ? (
                <Button size="sm" disabled={pending === loan.id} onClick={() => run(async () => {
                  const r = await appraiseLoan(loan.id);
                  if (r.ok && !r.eligible) toast.warning(r.reason || "Not yet eligible.");
                  return { ok: r.ok };
                }, loan.id)}>
                  Appraise
                </Button>
              ) : null}
              {loan.status === "appraisal" ? (
                <>
                  <Button size="sm" disabled={pending === loan.id} onClick={() => run(() => approveLoan(loan.id), loan.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending === loan.id} onClick={() => run(() => rejectLoan(loan.id), loan.id)}>
                    Reject
                  </Button>
                </>
              ) : null}
              {loan.status === "approved" ? (
                <Button size="sm" disabled={pending === loan.id} onClick={() => run(() => disburseLoan(loan.id), loan.id)}>
                  Disburse
                </Button>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
