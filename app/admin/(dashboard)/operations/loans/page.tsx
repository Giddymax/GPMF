import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { ArrearsQueue } from "@/components/admin/loans/arrears-queue";
import { GroupLendingBoard } from "@/components/admin/loans/group-lending-board";
import { LoanPipeline } from "@/components/admin/loans/loan-pipeline";
import { NewLoanDialog } from "@/components/admin/loans/new-loan-dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getArrearsQueue, getGroupsWithRoster, getLoansDetailed } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Loans" };

export default async function LoansPage() {
  const [loans, groups, arrears] = await Promise.all([
    getLoansDetailed(),
    getGroupsWithRoster(),
    getArrearsQueue(),
  ]);

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white">Loans</h1>
          <p className="mt-1 text-sm text-white/50">{loans.length} loan{loans.length === 1 ? "" : "s"} · {arrears.length} in arrears</p>
        </div>
        <NewLoanDialog />
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="groups">Group lending</TabsTrigger>
          <TabsTrigger value="arrears">Arrears{arrears.length > 0 ? ` (${arrears.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <LoanPipeline loans={loans} />
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <div className="mt-4">
            <GroupLendingBoard groups={groups} />
          </div>
        </TabsContent>

        <TabsContent value="arrears">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <ArrearsQueue rows={arrears} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
