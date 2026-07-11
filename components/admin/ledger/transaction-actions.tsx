"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

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
import { formatGHS } from "@/lib/utils";
import {
  deleteLedgerTransaction,
  getTransactionForEdit,
  updateLedgerTransactionAndLegs,
  type LedgerLegEdit,
  type TransactionForEdit,
} from "@/app/admin/(dashboard)/operations/ledger/actions";

function toDateInputValue(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

/**
 * Drop-in Edit/Delete pair for any row backed by a ledger transaction —
 * Client 360's activity feed, a loan's repayment history, the susu/deposits/
 * treasury pages, etc. Only needs the transaction id; fetches its own
 * description/date/legs lazily when Edit is opened, so callers don't have to
 * prefetch every leg for every row up front.
 */
export function TransactionActions({
  transactionId,
  label,
  amount,
  size = "sm",
}: {
  transactionId: string;
  label: string;
  amount?: number;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<TransactionForEdit | null>(null);
  const [loadingEdit, setLoadingEdit] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [entryDate, setEntryDate] = React.useState("");
  const [legs, setLegs] = React.useState<LedgerLegEdit[]>([]);
  const [pending, setPending] = React.useState(false);

  async function openEdit() {
    setLoadingEdit(true);
    const txn = await getTransactionForEdit(transactionId);
    setLoadingEdit(false);
    if (!txn) {
      toast.error("Could not load this transaction.");
      return;
    }
    setEditing(txn);
    setDescription(txn.description);
    setEntryDate(toDateInputValue(txn.entry_date));
    setLegs(txn.legs.map((l) => ({ id: l.id, debit: l.debit, credit: l.credit })));
  }

  function updateLeg(id: string, field: "debit" | "credit", value: number) {
    setLegs((current) => current.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  async function submitEdit() {
    if (!editing) return;
    setPending(true);
    const result = await updateLedgerTransactionAndLegs(editing.id, description, entryDate, legs);
    setPending(false);
    if (result.ok) {
      toast.success("Transaction updated.");
      setEditing(null);
      router.refresh();
    } else {
      toast.error(result.error || "Could not update transaction.");
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${label}"${amount !== undefined ? ` (${formatGHS(amount)})` : ""}? This removes it from the ledger entirely.`)) {
      return;
    }
    setPending(true);
    const result = await deleteLedgerTransaction(transactionId);
    setPending(false);
    if (result.ok) {
      toast.success("Transaction deleted.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not delete transaction.");
    }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <Button size={size} variant="outline" onClick={openEdit} disabled={loadingEdit} title="Edit transaction">
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={handleDelete}
          disabled={pending}
          title="Delete transaction"
          className="hover:border-danger-500 hover:text-danger-500"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`desc-${editing.id}`}>Description</Label>
                    <Input id={`desc-${editing.id}`} className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor={`date-${editing.id}`}>Date</Label>
                    <Input id={`date-${editing.id}`} type="date" className="mt-1.5" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Legs</p>
                  <div className="space-y-2">
                    {legs.map((leg) => {
                      const glInfo = editing.legs.find((l) => l.id === leg.id);
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
