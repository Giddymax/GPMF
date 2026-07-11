"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { LedgerEntryLegRow, LedgerTransactionRow } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";
import {
  deleteLedgerTransaction,
  reverseTransaction,
  updateLedgerTransactionAndLegs,
  type LedgerLegEdit,
} from "@/app/admin/(dashboard)/operations/ledger/actions";

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

function toDateInputValue(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

export function TransactionsTable({
  transactions,
  legsByTransaction,
}: {
  transactions: LedgerTransactionRow[];
  legsByTransaction: Record<string, LedgerEntryLegRow[]>;
}) {
  const router = useRouter();
  const [reverseTarget, setReverseTarget] = React.useState<LedgerTransactionRow | null>(null);
  const [reason, setReason] = React.useState("");
  const [editTarget, setEditTarget] = React.useState<LedgerTransactionRow | null>(null);
  const [editDescription, setEditDescription] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editLegs, setEditLegs] = React.useState<LedgerLegEdit[]>([]);
  const [pending, setPending] = React.useState(false);

  function openEdit(txn: LedgerTransactionRow) {
    setEditTarget(txn);
    setEditDescription(txn.description);
    setEditDate(toDateInputValue(txn.entry_date));
    setEditLegs((legsByTransaction[txn.id] ?? []).map((l) => ({ id: l.id, debit: l.debit, credit: l.credit })));
  }

  function updateLeg(id: string, field: "debit" | "credit", value: number) {
    setEditLegs((legs) => legs.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

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

  async function submitEdit() {
    if (!editTarget) return;
    setPending(true);
    const result = await updateLedgerTransactionAndLegs(editTarget.id, editDescription, editDate, editLegs);
    setPending(false);
    if (result.ok) {
      toast.success("Transaction updated.");
      setEditTarget(null);
      router.refresh();
    } else {
      toast.error(result.error || "Could not update transaction.");
    }
  }

  async function handleDelete(txn: LedgerTransactionRow) {
    if (!confirm(`Permanently delete "${txn.description}" (${formatGHS(txn.total_amount)})? This removes it from the ledger entirely — it will not appear in any past balance again.`)) {
      return;
    }
    setPending(true);
    const result = await deleteLedgerTransaction(txn.id);
    setPending(false);
    if (result.ok) {
      toast.success("Transaction deleted.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not delete transaction.");
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
                  <div className="flex flex-wrap justify-end gap-2">
                    {!isReversal && !txn.is_reversed ? (
                      <Button size="sm" variant="outline" onClick={() => setReverseTarget(txn)} title="Reverse">
                        <Undo2 className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => openEdit(txn)} title="Edit">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(txn)}
                      disabled={pending}
                      title="Delete"
                      className="hover:border-danger-500 hover:text-danger-500"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
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

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          {editTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Input id="editDescription" className="mt-1.5" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="editDate">Date</Label>
                    <Input id="editDate" type="date" className="mt-1.5" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Legs</p>
                  <div className="space-y-2">
                    {editLegs.map((leg) => {
                      const glInfo = (legsByTransaction[editTarget.id] ?? []).find((l) => l.id === leg.id);
                      return (
                        <div key={leg.id} className="grid grid-cols-3 items-center gap-2 rounded-md border border-border p-2">
                          <span className="text-xs text-muted-foreground">{glInfo?.gl_code} — {glInfo?.gl_name}</span>
                          <div>
                            <Label className="text-[10px]">Debit</Label>
                            <Input
                              type="number"
                              step="0.01"
                              className="mt-1 h-8"
                              value={leg.debit}
                              onChange={(e) => updateLeg(leg.id, "debit", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Credit</Label>
                            <Input
                              type="number"
                              step="0.01"
                              className="mt-1 h-8"
                              value={leg.credit}
                              onChange={(e) => updateLeg(leg.id, "credit", Number(e.target.value))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    No balance check is applied — debits and credits are saved exactly as entered.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={pending} onClick={submitEdit}>
                  {pending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
