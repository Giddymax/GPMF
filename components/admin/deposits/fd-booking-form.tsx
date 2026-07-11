"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ClientSearch } from "@/components/admin/client-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maturityValue } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";
import { bookFixedDeposit } from "@/app/admin/(dashboard)/operations/deposits/actions";

const TERMS = [
  { months: 3 as const, rate: 0.1 },
  { months: 6 as const, rate: 0.12 },
  { months: 12 as const, rate: 0.14 },
];

export function FdBookingForm() {
  const router = useRouter();
  const [client, setClient] = React.useState<{ id: string; label: string } | null>(null);
  const [principal, setPrincipal] = React.useState("2000");
  const [term, setTerm] = React.useState<(typeof TERMS)[number]>(TERMS[2]);
  const [submitting, setSubmitting] = React.useState(false);

  const maturity = maturityValue(Number(principal) || 0, term.rate, term.months);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) {
      toast.error("Select a client first.");
      return;
    }
    setSubmitting(true);
    const result = await bookFixedDeposit({ clientId: client.id, principal: Number(principal), termMonths: term.months });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Fixed deposit booked.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not book the deposit.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label>Client</Label>
          <div className="mt-1.5">
            <ClientSearch onSelect={setClient} />
          </div>
        </div>
        <div>
          <Label htmlFor="principal">Principal (GHS)</Label>
          <Input
            id="principal"
            type="number"
            min={500}
            className="mt-1.5"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
        <div>
          <Label>Term</Label>
          <div className="mt-1.5 flex gap-2">
            {TERMS.map((t) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setTerm(t)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                  term.months === t.months
                    ? "border-gold-500 bg-gradient-gold text-navy-900"
                    : "border-white/10 text-white/70 hover:bg-white/5"
                }`}
              >
                {t.months} months
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={submitting || !client}>
          {submitting ? "Booking…" : "Book fixed deposit"}
        </Button>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-wide text-white/50">Maturity preview</p>
        <p className="mt-2 font-heading text-3xl font-semibold text-gold-500">{formatGHS(maturity)}</p>
        <p className="mt-1 text-sm text-white/60">
          {formatGHS(Number(principal) || 0)} at {(term.rate * 100).toFixed(1)}% p.a. for {term.months} months
        </p>
      </div>
    </form>
  );
}
