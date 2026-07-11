import type { Metadata } from "next";

import { CashUp } from "@/components/admin/susu/cash-up";
import { CollectionSheet } from "@/components/admin/susu/collection-sheet";
import { PayoutQueue } from "@/components/admin/susu/payout-queue";
import { RecentCollections } from "@/components/admin/susu/recent-collections";
import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgentCashBalances, getAgents, getRecentSusuContributions, getSusuCyclesWithClients } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Susu Collections" };

export default async function SusuPage() {
  const [activeCycles, completedCycles, agents, agentCashBalances, recentCollections] = await Promise.all([
    getSusuCyclesWithClients("active"),
    getSusuCyclesWithClients("completed"),
    getAgents(),
    getAgentCashBalances(),
    getRecentSusuContributions(50),
  ]);

  const expectedByAgent = Object.fromEntries(agentCashBalances.map((b) => [b.agent_id, b.cash_on_hand]));

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Susu Collections</h1>
        <p className="mt-1 text-sm text-white/50">
          {activeCycles.length} active cycle{activeCycles.length === 1 ? "" : "s"} · {completedCycles.length} awaiting payout
        </p>
      </div>

      <Tabs defaultValue="sheet">
        <TabsList>
          <TabsTrigger value="sheet">Collection sheet</TabsTrigger>
          <TabsTrigger value="payouts">Payout queue</TabsTrigger>
          <TabsTrigger value="recent">Recent collections</TabsTrigger>
          <TabsTrigger value="cashup">Agent cash-up</TabsTrigger>
        </TabsList>

        <TabsContent value="sheet">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <CollectionSheet cycles={activeCycles} />
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <PayoutQueue cycles={completedCycles} />
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <RecentCollections contributions={recentCollections} />
          </Card>
        </TabsContent>

        <TabsContent value="cashup">
          <Card className="mt-4 border-white/10 bg-navy-800">
            <CashUp agents={agents} expectedByAgent={expectedByAgent} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
