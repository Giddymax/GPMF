import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Printer, User } from "lucide-react";

import { CloseClientButton } from "@/components/admin/clients/close-client-button";
import { DeleteClientDialog } from "@/components/admin/clients/delete-client-dialog";
import { EditClientDialog } from "@/components/admin/clients/edit-client-dialog";
import { TransactionActions } from "@/components/admin/ledger/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PRODUCT_INTEREST_OPTIONS } from "@/lib/validation/client";
import {
  getAccountBalancesForClient,
  getActiveSusuCycleForClient,
  getAgents,
  getAvgMonthlySavingsInflow,
  getClientActivity,
  getClientById,
  getClientGroupMembership,
  getFixedDepositsForClient,
  getLoansForClient,
} from "@/lib/data/admin";
import { eligibilityLimit } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = { title: "Client 360" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [balances, fds, loans, activity, agents, avgInflow, activeCycle, groupMembership] = await Promise.all([
    getAccountBalancesForClient(id),
    getFixedDepositsForClient(id),
    getLoansForClient(id),
    getClientActivity(id),
    getAgents(),
    getAvgMonthlySavingsInflow(id),
    getActiveSusuCycleForClient(id),
    getClientGroupMembership(id),
  ]);

  const agent = agents.find((a) => a.id === client.agent_id);
  const savings = balances.find((b) => b.account_type === "savings");
  const susu = balances.find((b) => b.account_type === "susu");
  const maxLoanPrincipal = eligibilityLimit(avgInflow);
  const cycleDay = activeCycle
    ? Math.min(
        Math.floor((Date.now() - new Date(activeCycle.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        31
      )
    : null;

  return (
    <div>
      <Link href="/admin/operations/clients" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="size-4" /> All clients
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
            {client.photo_url ? (
              <Image src={client.photo_url} alt="" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <User className="size-6 text-white/40" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold text-white">{client.full_name}</h1>
              <Badge variant={client.status === "active" ? "emerald" : "muted"} className="capitalize">{client.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-white/50">
              {client.client_code} · {client.phone} · {client.town}
              {agent ? ` · Agent: ${agent.full_name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <EditClientDialog client={client} agents={agents} />
          <Button variant="outline" asChild>
            <Link href={`/admin/operations/clients/${id}/card`}>
              <Printer className="size-4" /> Print card
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/admin/operations/clients/${id}/statement.csv`}>
              <Download className="size-4" /> Download statement (CSV)
            </a>
          </Button>
          <CloseClientButton clientId={client.id} clientName={client.full_name} />
          <DeleteClientDialog clientId={client.id} clientName={client.full_name} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Savings balance</p>
            <p className="mt-1 font-heading text-xl font-semibold text-white">{formatGHS(savings?.balance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Susu balance (current cycle)</p>
            <p className="mt-1 font-heading text-xl font-semibold text-white">{formatGHS(susu?.balance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Avg. monthly savings inflow</p>
            <p className="mt-1 font-heading text-xl font-semibold text-white">{formatGHS(avgInflow)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-navy-800">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Loan eligibility (2x inflow)</p>
            <p className="mt-1 font-heading text-xl font-semibold text-gold-500">{formatGHS(maxLoanPrincipal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-white/70">
            <p><span className="text-white/50">Ghana Card:</span> {client.ghana_card_no ?? "—"}</p>
            {client.date_of_birth ? <p><span className="text-white/50">Date of birth:</span> {new Date(client.date_of_birth).toLocaleDateString("en-GH")}</p> : null}
            {client.gender ? <p className="capitalize"><span className="text-white/50">Gender:</span> {client.gender}</p> : null}
            {client.occupation ? <p><span className="text-white/50">Occupation:</span> {client.occupation}</p> : null}
            {client.email ? <p><span className="text-white/50">Email:</span> {client.email}</p> : null}
            <p>
              <span className="text-white/50">Location:</span>{" "}
              {[client.town, client.area, client.region].filter(Boolean).join(", ") || "—"}
            </p>
            {client.digital_address ? <p><span className="text-white/50">Digital address:</span> {client.digital_address}</p> : null}
            {client.interested_products.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-white/50">Interested in:</span>
                {client.interested_products.map((p) => (
                  <Badge key={p} variant="outline" className="border-white/20 text-white/70">
                    {PRODUCT_INTEREST_OPTIONS.find((o) => o.value === p)?.label ?? p}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {client.next_of_kin_name ? (
          <Card className="border-white/10 bg-navy-800">
            <CardHeader>
              <CardTitle className="text-white">Next of kin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-white/70">
              <p><span className="text-white/50">Name:</span> {client.next_of_kin_name}</p>
              <p><span className="text-white/50">Relationship:</span> {client.next_of_kin_relationship}</p>
              <p><span className="text-white/50">Phone:</span> {client.next_of_kin_phone}</p>
              {client.next_of_kin_address ? <p><span className="text-white/50">Address:</span> {client.next_of_kin_address}</p> : null}
            </CardContent>
          </Card>
        ) : null}

        {activeCycle ? (
          <Card className="border-white/10 bg-navy-800">
            <CardHeader>
              <CardTitle className="text-white">Susu cycle progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-white/60">Day {cycleDay} of 31</span>
                <span className="text-white/60">{formatGHS(activeCycle.daily_amount)}/day</span>
              </div>
              <Progress value={((cycleDay ?? 0) / 31) * 100} className="mt-2 bg-white/10" />
            </CardContent>
          </Card>
        ) : null}

        {groupMembership ? (
          <Card className="border-white/10 bg-navy-800">
            <CardHeader>
              <CardTitle className="text-white">Group membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-white/70">
              <p><span className="text-white/50">Group:</span> {groupMembership.group.name}</p>
              <p><span className="text-white/50">Tranche:</span> {groupMembership.member.tranche_index + 1} of 3</p>
              <p>
                <span className="text-white/50">Status:</span>{" "}
                <Badge variant={groupMembership.member.status === "current" ? "emerald" : "muted"} className="capitalize">
                  {groupMembership.member.status}
                </Badge>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {fds.length > 0 ? (
          <Card className="border-white/10 bg-navy-800">
            <CardHeader>
              <CardTitle className="text-white">Fixed deposits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fds.map((fd) => (
                <div key={fd.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{fd.fd_number} · {fd.term_months}mo @ {(fd.annual_rate * 100).toFixed(1)}%</span>
                  <span className="font-medium text-white">{formatGHS(fd.principal)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {loans.length > 0 ? (
          <Card className="border-white/10 bg-navy-800">
            <CardHeader>
              <CardTitle className="text-white">Loans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/operations/loans/${loan.id}`} className="text-white/70 hover:text-gold-500">
                    {loan.loan_number} · {loan.term_months}mo
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{formatGHS(loan.principal)}</span>
                    <Badge variant="outline" className="border-white/20 capitalize text-white/70">{loan.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-white/40">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 text-sm last:border-0">
                  <div>
                    <p className="text-white/80">{a.description}</p>
                    <p className="text-xs text-white/40">{new Date(a.date).toLocaleString("en-GH")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{formatGHS(a.amount)}</span>
                    {a.ledger_transaction_id ? (
                      <TransactionActions transactionId={a.ledger_transaction_id} label={a.description} amount={a.amount} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
