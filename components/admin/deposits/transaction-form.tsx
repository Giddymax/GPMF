"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ClientSearch } from "@/components/admin/client-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WITHDRAWAL_APPROVAL_THRESHOLD } from "@/lib/validation/deposit";
import { formatGHS } from "@/lib/utils";
import {
  lookupClientSavingsAccount,
  postSavingsTransaction,
} from "@/app/admin/(dashboard)/operations/deposits/actions";

export function TransactionForm() {
  const router = useRouter();
  const [client, setClient] = React.useState<{ id: string; label: string } | null>(null);
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [type, setType] = React.useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSelectClient(c: { id: string; label: string }) {
    setClient(c);
    const account = await lookupClientSavingsAccount(c.id);
    setAccountId(account?.account_id ?? null);
    setBalance(account?.balance ?? 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) {
      toast.error("Select a client with a savings account first.");
      return;
    }
    setSubmitting(true);
    const result = await postSavingsTransaction({ accountId, type, amount: Number(amount) });
    setSubmitting(false);
    if (result.ok) {
      toast.success(result.pendingApproval ? "Submitted for manager approval." : "Transaction posted.");
      setAmount("");
      router.refresh();
    } else {
      toast.error(result.error || "Could not post the transaction.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Client</Label>
        <div className="mt-1.5">
          <ClientSearch onSelect={handleSelectClient} />
        </div>
        {client && balance !== null ? (
          <p className="mt-1.5 text-xs text-white/50">Savings balance: {formatGHS(balance)}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "deposit" | "withdrawal")}>
            <SelectTrigger id="type" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount (GHS)</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            className="mt-1.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      {type === "withdrawal" && Number(amount) > WITHDRAWAL_APPROVAL_THRESHOLD ? (
        <p className="text-xs text-gold-500">
          Withdrawals over {formatGHS(WITHDRAWAL_APPROVAL_THRESHOLD)} require manager approval before posting.
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || !accountId}>
        {submitting ? "Posting…" : "Post transaction"}
      </Button>
    </form>
  );
}
