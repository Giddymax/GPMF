"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeTreasuryFunds } from "@/app/admin/(dashboard)/operations/treasury/actions";

export function PlacementForm() {
  const router = useRouter();
  const [principal, setPrincipal] = React.useState("1000");
  const [rate, setRate] = React.useState("22");
  const [days, setDays] = React.useState("91");
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await placeTreasuryFunds(Number(principal), Number(rate) / 100, Number(days));
    setSubmitting(false);
    if (result.ok) {
      toast.success("T-bill placement recorded.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not record placement.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:items-end">
      <div>
        <Label htmlFor="principal">Principal (GHS)</Label>
        <Input id="principal" type="number" className="mt-1.5" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="rate">Rate (% p.a.)</Label>
        <Input id="rate" type="number" step="0.1" className="mt-1.5" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="days">Term (days)</Label>
        <Input id="days" type="number" className="mt-1.5" value={days} onChange={(e) => setDays(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Placing…" : "Place funds"}
      </Button>
    </form>
  );
}
