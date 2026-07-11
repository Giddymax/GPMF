import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { FdBookingForm } from "@/components/admin/deposits/fd-booking-form";
import { FdMaturityCalendar } from "@/components/admin/deposits/fd-maturity-calendar";
import { PendingApprovals } from "@/components/admin/deposits/pending-approvals";
import { RecentTransactions } from "@/components/admin/deposits/recent-transactions";
import { TransactionForm } from "@/components/admin/deposits/transaction-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActiveFixedDepositsWithClient, getPendingApprovals, getRecentSavingsTransactions } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Deposits" };

export default async function DepositsPage() {
  const [approvals, fds, recentTransactions] = await Promise.all([
    getPendingApprovals("savings_withdrawal"),
    getActiveFixedDepositsWithClient(),
    getRecentSavingsTransactions(50),
  ]);

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Deposits</h1>
        <p className="mt-1 text-sm text-white/50">Savings transactions, fixed deposit booking, and maturities.</p>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="recent">Recent transactions</TabsTrigger>
          <TabsTrigger value="fd">Book fixed deposit</TabsTrigger>
          <TabsTrigger value="calendar">FD maturity calendar</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals{approvals.length > 0 ? ` (${approvals.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card className="mt-4 max-w-lg border-white/10 bg-navy-800">
            <CardContent className="pt-6">
              <TransactionForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <RecentTransactions transactions={recentTransactions} />
          </Card>
        </TabsContent>

        <TabsContent value="fd">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <CardContent className="pt-6">
              <FdBookingForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <FdMaturityCalendar deposits={fds} />
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <PendingApprovals approvals={approvals} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
