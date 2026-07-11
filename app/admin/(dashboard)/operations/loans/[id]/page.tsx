import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RepaymentForm } from "@/components/admin/loans/repayment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLoanSchedules, getLoansDetailed } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = { title: "Loan detail" };

const SCHEDULE_VARIANT: Record<string, "muted" | "gold" | "emerald" | "destructive"> = {
  pending: "muted",
  paid: "emerald",
  partial: "gold",
  overdue: "destructive",
};

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [loans, schedules] = await Promise.all([getLoansDetailed(), getLoanSchedules(id)]);
  const loan = loans.find((l) => l.id === id);
  if (!loan) notFound();

  const totalDue = schedules.reduce((s, x) => s + x.total_due, 0);
  const totalPaid = schedules.filter((s) => s.status === "paid").reduce((s, x) => s + x.total_due, 0);

  return (
    <div>
      <Link href="/admin/operations/loans" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="size-4" /> All loans
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white">{loan.loan_number}</h1>
          <p className="mt-1 text-sm text-white/50">{loan.party_name} · {formatGHS(loan.principal)} · {loan.term_months} months</p>
        </div>
        <Badge variant="gold" className="capitalize">{loan.status}</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Total repayable</p>
            <p className="mt-1 font-heading text-xl font-semibold text-white">{formatGHS(totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Paid so far</p>
            <p className="mt-1 font-heading text-xl font-semibold text-emerald-500">{formatGHS(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Outstanding</p>
            <p className="mt-1 font-heading text-xl font-semibold text-gold-500">{formatGHS(totalDue - totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">Repayment schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-white/40">Not yet disbursed — no schedule generated.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50">#</TableHead>
                  <TableHead className="text-white/50">Due date</TableHead>
                  <TableHead className="text-white/50">Amount due</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-white/70">{s.period_number}</TableCell>
                    <TableCell className="text-white/70">{new Date(s.due_date).toLocaleDateString("en-GH")}</TableCell>
                    <TableCell className="text-white/70">{formatGHS(s.total_due)}</TableCell>
                    <TableCell>
                      <Badge variant={SCHEDULE_VARIANT[s.status]} className="capitalize">{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === "pending" || s.status === "overdue" || s.status === "partial" ? (
                        <RepaymentForm loanId={loan.id} scheduleId={s.id} defaultAmount={s.total_due} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
