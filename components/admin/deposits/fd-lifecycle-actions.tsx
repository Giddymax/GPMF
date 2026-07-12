"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FixedDepositWithClient } from "@/lib/data/admin";
import type { Approval } from "@/lib/supabase/types";
import {
  payOutMaturedFd,
  requestFdEarlyWithdrawal,
  requestFdRollover,
} from "@/app/admin/(dashboard)/operations/deposits/actions";

const TERMS = [3, 6, 12] as const;

export function FdLifecycleActions({
  fd,
  pendingApproval,
}: {
  fd: FixedDepositWithClient;
  pendingApproval?: Approval;
}) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<"early" | "rollover" | null>(null);
  const [notes, setNotes] = React.useState("");
  const [rolloverTerm, setRolloverTerm] = React.useState<(typeof TERMS)[number]>(fd.term_months as (typeof TERMS)[number] ?? 12);
  const [interestDisposition, setInterestDisposition] = React.useState<"cash" | "capitalize">("capitalize");
  const [pending, setPending] = React.useState(false);

  async function payOut() {
    if (!confirm(`Pay out ${fd.fd_number} in full (principal + interest)?`)) return;
    setPending(true);
    const result = await payOutMaturedFd(fd.id);
    setPending(false);
    if (result.ok) {
      toast.success("Fixed deposit paid out.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not pay out the deposit.");
    }
  }

  async function submitEarlyWithdrawal() {
    setPending(true);
    const result = await requestFdEarlyWithdrawal({ fdId: fd.id, notes: notes || undefined });
    setPending(false);
    if (result.ok) {
      toast.success("Early withdrawal request submitted for approval.");
      setDialog(null);
      router.refresh();
    } else {
      toast.error(result.error || "Could not submit the request.");
    }
  }

  async function submitRollover() {
    setPending(true);
    const result = await requestFdRollover({ fdId: fd.id, newTermMonths: rolloverTerm, interestDisposition });
    setPending(false);
    if (result.ok) {
      toast.success("Rollover request submitted for approval.");
      setDialog(null);
      router.refresh();
    } else {
      toast.error(result.error || "Could not submit the request.");
    }
  }

  if (pendingApproval) {
    return (
      <Badge variant="gold" className="capitalize">
        Pending {pendingApproval.action.replace("_", " ")}
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {fd.status === "matured" ? (
        <Button size="sm" disabled={pending} onClick={payOut}>
          Pay out
        </Button>
      ) : null}
      {fd.status === "active" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setDialog("early")}>
          Early withdrawal
        </Button>
      ) : null}
      {fd.status === "active" || fd.status === "matured" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setDialog("rollover")}>
          Rollover
        </Button>
      ) : null}

      <Dialog open={dialog === "early"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request early withdrawal — {fd.fd_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Principal only will be paid out on approval; accrued interest is forfeited. Requires manager/admin approval.
            </p>
            <div>
              <Label htmlFor="early-notes">Reason (optional)</Label>
              <Textarea id="early-notes" className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={submitEarlyWithdrawal}>
              {pending ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "rollover"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request rollover — {fd.fd_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <Label>New term</Label>
              <div className="mt-1.5 flex gap-2">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRolloverTerm(t)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                      rolloverTerm === t
                        ? "border-gold-500 bg-gradient-gold text-navy-900"
                        : "border-white/10 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {t} months
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Interest on the matured term</Label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setInterestDisposition("capitalize")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    interestDisposition === "capitalize"
                      ? "border-gold-500 bg-gradient-gold text-navy-900"
                      : "border-white/10 text-white/70 hover:bg-white/5"
                  }`}
                >
                  Capitalize into new principal
                </button>
                <button
                  type="button"
                  onClick={() => setInterestDisposition("cash")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    interestDisposition === "cash"
                      ? "border-gold-500 bg-gradient-gold text-navy-900"
                      : "border-white/10 text-white/70 hover:bg-white/5"
                  }`}
                >
                  Pay out in cash
                </button>
              </div>
            </div>
            <p className="text-muted-foreground">Requires manager/admin approval before the new fixed deposit is opened.</p>
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={submitRollover}>
              {pending ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
