"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordRepayment } from "@/app/admin/(dashboard)/operations/loans/actions";

export function RepaymentForm({ loanId, scheduleId, defaultAmount }: { loanId: string; scheduleId: string; defaultAmount: number }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(defaultAmount));
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    setSubmitting(true);
    const result = await recordRepayment(loanId, scheduleId, Number(amount));
    setSubmitting(false);
    if (result.ok) {
      toast.success("Repayment recorded.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not record repayment.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="number" className="h-8 w-24 text-xs" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Button size="sm" disabled={submitting} onClick={submit}>
        Record
      </Button>
    </div>
  );
}
