import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { RatioGauge } from "@/components/admin/ratio-gauge";
import { StatCard } from "@/components/admin/stat-card";
import { PlacementForm } from "@/components/admin/treasury/placement-form";
import { PlacementsTable } from "@/components/admin/treasury/placements-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAgentCashBalances,
  getAgents,
  getGlTrialBalance,
  getInstitutionTotals,
  getTreasuryPlacements,
} from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";
import { liquidityRatio, RATIO_BENCHMARKS } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = { title: "Treasury & Cash" };

export default async function TreasuryPage() {
  const [totals, trialBalance, placements, agentCash, agents] = await Promise.all([
    getInstitutionTotals(),
    getGlTrialBalance(),
    getTreasuryPlacements(),
    getAgentCashBalances(),
    getAgents(),
  ]);

  const bank = trialBalance.find((r) => r.code === "BANK")?.balance ?? 0;
  const tbill = trialBalance.find((r) => r.code === "TBILL")?.balance ?? 0;
  const agentCashById = new Map(agentCash.map((a) => [a.agent_id, a.cash_on_hand]));
  const totalAgentCash = agentCash.reduce((s, a) => s + a.cash_on_hand, 0);
  const liquidity = liquidityRatio(totals.liquid_assets, totals.total_deposits);

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Treasury &amp; Cash</h1>
        <p className="mt-1 text-sm text-white/50">Cash position, T-bill placements, and the liquidity reserve.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Field agent cash" value={formatGHS(totalAgentCash)} />
        <StatCard label="Bank" value={formatGHS(bank)} />
        <StatCard label="T-bill investments" value={formatGHS(tbill)} />
        <StatCard label="Total liquid assets" value={formatGHS(totals.liquid_assets)} tone="positive" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-navy-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Cash by agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{agent.full_name} <span className="text-white/40">({agent.employee_code})</span></span>
                <span className="font-medium text-white">{formatGHS(agentCashById.get(agent.id) ?? 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Reserve tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <RatioGauge label="Liquidity ratio" value={liquidity} benchmark={RATIO_BENCHMARKS.liquidityAlert} />
            <p className="mt-3 text-xs text-white/50">Guardrail: liquid assets must stay at or above 30% of total deposit liabilities.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">New T-bill placement</CardTitle>
        </CardHeader>
        <CardContent>
          <PlacementForm />
        </CardContent>
      </Card>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">Placements</CardTitle>
        </CardHeader>
        <CardContent>
          <PlacementsTable placements={placements} />
        </CardContent>
      </Card>
    </div>
  );
}
