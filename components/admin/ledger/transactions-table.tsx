"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { TransactionActions } from "@/components/admin/ledger/transaction-actions";
import type { LedgerTransactionRow } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";
import { reverseTransaction } from "@/app/admin/(dashboard)/operations/ledger/actions";

const REFERENCE_LABELS: Record<string, string> = {
  susu_contribution: "Susu collection",
  susu_payout: "Susu payout",
  savings_deposit: "Savings deposit",
  savings_withdrawal: "Savings withdrawal",
  fd_booking: "Fixed deposit booking",
  loan_disbursement: "Loan disbursement",
  loan_repayment: "Loan repayment",
  treasury_placement: "T-bill placement",
  treasury_income: "Treasury income",
  group_collateral: "Group collateral",
  agent_commission: "Agent commission",
  provision_true_up: "Provision true-up",
  equity_injection: "Equity injection",
};

export function TransactionsTable({ transactions }: { transactions: LedgerTransactionRow[] }) {
  const router = useRouter();
  const [reverseTarget, setReverseTarget] = React.useState<LedgerTransactionRow | null>(null);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submitReversal() {
    if (!reverseTarget) return;
    setPending(true);
    const result = await reverseTransaction(reverseTarget.id, reason);
    setPending(false);
    if (result.ok) {
      toast.success("Transaction reversed.");
      setReverseTarget(null);
      setReason("");
      router.refresh();
    } else {
      toast.error(result.error || "Could not reverse transaction.");
    }
  }

  if (transactions.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No ledger transactions yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/50">Date</TableHead>
            <TableHead className="text-white/50">Description</TableHead>
            <TableHead className="text-white/50">Type</TableHead>
            <TableHead className="text-white/50">Amount</TableHead>
            <TableHead className="text-white/50">Status</TableHead>
            <TableHead className="text-white/50" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => {
            const isReversal = Boolean(txn.reverses_transaction_id);
            return (
              <TableRow key={txn.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-white/70">{new Date(txn.entry_date).toLocaleDateString("en-GH")}</TableCell>
                <TableCell className="text-white">{txn.description}</TableCell>
                <TableCell className="text-white/70">{REFERENCE_LABELS[txn.reference_type] ?? txn.reference_type}</TableCell>
                <TableCell className="text-white/70">{formatGHS(txn.total_amount)}</TableCell>
                <TableCell>
                  {isReversal ? (
                    <Badge variant="outline" className="border-white/20 text-white/70">Reversal</Badge>
                  ) : txn.is_reversed ? (
                    <Badge variant="muted">Reversed</Badge>
                  ) : (
                    <Badge variant="emerald">Posted</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {!isReversal && !txn.is_reversed ? (
                      <Button size="sm" variant="outline" onClick={() => setReverseTarget(txn)} title="Reverse">
                        <Undo2 className="size-3.5" />
                      </Button>
                    ) : null}
                    <TransactionActions transactionId={txn.id} label={txn.description} amount={txn.total_amount} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Reverse dialog */}
      <Dialog open={!!reverseTarget} onOpenChange={(open) => !open && setReverseTarget(null)}>
        <DialogContent>
          {reverseTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Reverse: {reverseTarget.description}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Posts an equal-and-opposite mirror transaction ({formatGHS(reverseTarget.total_amount)}).
                </p>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" className="mt-1.5" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" disabled={pending || !reason.trim()} onClick={submitReversal}>
                  {pending ? "Reversing…" : "Reverse transaction"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
