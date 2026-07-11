import type { Metadata } from "next";

import { AlertsList, type Alert } from "@/components/admin/dashboard/alerts-list";
import { AlmTable, type AlmRow } from "@/components/admin/dashboard/alm-table";
import { ParLadder } from "@/components/admin/dashboard/par-ladder";
import { RatioTrendChart } from "@/components/admin/dashboard/ratio-trend-chart";
import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { RatioGauge } from "@/components/admin/ratio-gauge";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActiveFixedDepositMaturities,
  getAgents,
  getInstitutionTotals,
  getLoanParBuckets,
  getLoans,
  getPendingLoanSchedules,
  getProductConfig,
  getRatioHistory,
} from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";
import {
  RATIO_BENCHMARKS,
  breakEvenPortfolio,
  costPerBorrower,
  liquidityRatio,
  loanToDepositRatio,
  parBucket,
  type ParBucket,
} from "@/lib/finance";
import { formatGHS, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function bucketMaturity(dateStr: string): "0-30" | "31-90" | "91-180" | "180+" {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return "0-30";
  if (days <= 90) return "31-90";
  if (days <= 180) return "91-180";
  return "180+";
}

export default async function OperationsDashboardPage() {
  const [totals, ratioHistory, parBuckets, schedules, fdMaturities, productConfig, agents, disbursedLoans] =
    await Promise.all([
      getInstitutionTotals(),
      getRatioHistory(12),
      getLoanParBuckets(),
      getPendingLoanSchedules(),
      getActiveFixedDepositMaturities(),
      getProductConfig(),
      getAgents(),
      getLoans("disbursed"),
    ]);

  const latest = ratioHistory[0] ?? null;
  const opexConfig = productConfig.find((c) => c.key === "opex_monthly");
  const opexMonthly = Number((opexConfig?.value as { amount?: number })?.amount ?? 0);
  const loanRateConfig = productConfig.find((c) => c.key === "loan_monthly_flat_rate");
  const pricedMonthlyRate = Number((loanRateConfig?.value as { rate?: number })?.rate ?? 0.045);
  const pricedAnnualYield = pricedMonthlyRate * 12;

  const parBucketTotals: Record<ParBucket, number> = { current: 0, "1-30": 0, "31-90": 0, "90+": 0 };
  for (const row of parBuckets) {
    parBucketTotals[parBucket(row.days_past_due)] += row.outstanding_principal;
  }
  const par30Outstanding = parBucketTotals["31-90"] + parBucketTotals["90+"];

  const liveLiquidity = liquidityRatio(totals.liquid_assets, totals.total_deposits);
  const liveLoanToDeposit = loanToDepositRatio(totals.gross_loan_portfolio, totals.total_deposits);
  const liveCostPerBorrower = costPerBorrower(opexMonthly, disbursedLoans.length || 0);
  const liveBorrowersPerStaff = agents.length > 0 ? disbursedLoans.length / agents.length : null;

  const breakEven = breakEvenPortfolio(opexMonthly, pricedAnnualYield, 0.06, 0.02);

  // ALM maturity ladder: outstanding loan installments (assets) vs FD maturities (liabilities).
  const almBuckets: Record<string, { assets: number; liabilities: number }> = {
    "0-30": { assets: 0, liabilities: 0 },
    "31-90": { assets: 0, liabilities: 0 },
    "91-180": { assets: 0, liabilities: 0 },
    "180+": { assets: 0, liabilities: 0 },
  };
  for (const s of schedules) almBuckets[bucketMaturity(s.due_date)].assets += s.total_due;
  for (const fd of fdMaturities) almBuckets[bucketMaturity(fd.maturity_date)].liabilities += fd.principal;
  const almRows: AlmRow[] = Object.entries(almBuckets).map(([bucket, v]) => ({ bucket, ...v }));

  const alerts: Alert[] = [];
  if (liveLiquidity !== null && liveLiquidity < RATIO_BENCHMARKS.liquidityAlert) {
    alerts.push({ severity: "critical", message: `Liquidity ratio is ${formatPercent(liveLiquidity)}, below the 30% reserve requirement.` });
  }
  if (liveLoanToDeposit !== null && liveLoanToDeposit > RATIO_BENCHMARKS.loanToDepositAlert) {
    alerts.push({ severity: "warning", message: `Loan-to-deposit ratio is ${formatPercent(liveLoanToDeposit)}, above the 60% guardrail.` });
  }
  const grossPortfolio = totals.gross_loan_portfolio || 1;
  const par30Live = par30Outstanding / grossPortfolio;
  if (par30Live > RATIO_BENCHMARKS.par30Alert) {
    alerts.push({ severity: "warning", message: `PAR30 is ${formatPercent(par30Live)}, above the 5% alert threshold.` });
  }
  if (latest?.oss !== null && latest?.oss !== undefined && latest.oss < RATIO_BENCHMARKS.ossBreakEven) {
    alerts.push({ severity: "critical", message: `Operational Self-Sufficiency is ${formatPercent(latest.oss)}, below break-even.` });
  }
  if (latest?.risk_coverage_ratio !== null && latest?.risk_coverage_ratio !== undefined && latest.risk_coverage_ratio < RATIO_BENCHMARKS.riskCoverage) {
    alerts.push({ severity: "warning", message: `Risk coverage ratio is ${formatPercent(latest.risk_coverage_ratio)}, below 100% of PAR30.` });
  }
  const upcomingFdCount = fdMaturities.filter((fd) => bucketMaturity(fd.maturity_date) === "0-30").length;
  if (upcomingFdCount > 0) {
    alerts.push({ severity: "warning", message: `${upcomingFdCount} fixed deposit(s) mature within 7–30 days — plan liquidity.` });
  }
  if (almRows.some((r) => r.assets - r.liabilities < 0)) {
    alerts.push({ severity: "warning", message: "One or more ALM buckets show a negative gap (liabilities maturing faster than assets)." });
  }

  const trendData = [...ratioHistory].reverse().map((r) => ({
    date: new Date(r.snapshot_date).toLocaleDateString("en-GH", { month: "short", year: "2-digit" }),
    oss: r.oss,
    fss: r.fss,
    par30: r.par30,
    liquidity: r.liquidity_ratio,
  }));

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Financial Performance</h1>
        <p className="mt-1 text-sm text-white/50">Are we self-sustaining? SEEP/CGAP standard ratios, live and trended.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total deposits" value={formatGHS(totals.total_deposits)} />
        <StatCard label="Gross loan portfolio" value={formatGHS(totals.gross_loan_portfolio)} />
        <StatCard label="Liquid assets" value={formatGHS(totals.liquid_assets)} />
        <StatCard
          label="Net income (latest month)"
          value={latest ? formatGHS(latest.net_income ?? 0) : "—"}
          tone={latest && (latest.net_income ?? 0) >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-navy-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Sustainability &amp; profitability</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <RatioGauge label="Operational Self-Sufficiency (OSS)" value={latest?.oss ?? null} benchmark={RATIO_BENCHMARKS.oss} />
            <RatioGauge label="Financial Self-Sufficiency (FSS)" value={latest?.fss ?? null} benchmark={RATIO_BENCHMARKS.fss} />
            <RatioGauge label="Return on Assets (ROA)" value={latest?.roa ?? null} benchmark={RATIO_BENCHMARKS.roa} />
            <RatioGauge label="Return on Equity (ROE)" value={latest?.roe ?? null} benchmark={RATIO_BENCHMARKS.roe} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Active alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={alerts} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Portfolio yield vs. priced yield</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RatioGauge label="Actual portfolio yield" value={latest?.portfolio_yield ?? null} benchmark={pricedAnnualYield} />
            <p className="text-xs text-white/50">Priced yield (from product_config): {formatPercent(pricedAnnualYield)} p.a.</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Liquidity &amp; funding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RatioGauge label="Liquidity ratio (live)" value={liveLiquidity} benchmark={RATIO_BENCHMARKS.liquidityAlert} />
            <RatioGauge
              label="Loan-to-deposit ratio (live)"
              value={liveLoanToDeposit}
              benchmark={RATIO_BENCHMARKS.loanToDepositAlert}
              higherIsBetter={false}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RatioGauge
              label="Operating expense ratio"
              value={latest?.operating_expense_ratio ?? null}
              benchmark={RATIO_BENCHMARKS.operatingExpenseRatioAlert}
              higherIsBetter={false}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Cost per borrower</span>
              <span className="font-semibold text-white">{liveCostPerBorrower !== null ? formatGHS(liveCostPerBorrower) : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Borrowers per staff</span>
              <span className="font-semibold text-white">{liveBorrowersPerStaff !== null ? liveBorrowersPerStaff.toFixed(1) : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Portfolio quality (PAR ladder)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ParLadder buckets={parBucketTotals} />
            <RatioGauge
              label="Risk coverage ratio"
              value={latest?.risk_coverage_ratio ?? null}
              benchmark={RATIO_BENCHMARKS.riskCoverage}
              cap={2}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-navy-800">
          <CardHeader>
            <CardTitle className="text-white">Break-even portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-white/60">
              At {formatPercent(pricedAnnualYield)} pricing, 6% funding cost and a 2% loss rate, we
              break even on fixed costs of {formatGHS(opexMonthly)}/month at a portfolio of:
            </p>
            <p className="font-heading text-2xl font-semibold text-gold-500">
              {breakEven !== null ? formatGHS(breakEven) : "Not achievable at current pricing"}
            </p>
            <p className="text-xs text-white/40">Current gross loan portfolio: {formatGHS(totals.gross_loan_portfolio)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">Asset-liability maturity ladder</CardTitle>
        </CardHeader>
        <CardContent>
          <AlmTable rows={almRows} />
        </CardContent>
      </Card>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">Ratio trends</CardTitle>
        </CardHeader>
        <CardContent>
          <RatioTrendChart
            data={trendData}
            series={[
              { key: "oss", color: "#D4AF37", label: "OSS" },
              { key: "fss", color: "#10B981", label: "FSS" },
              { key: "par30", color: "#DC2626", label: "PAR30" },
              { key: "liquidity", color: "#60A5FA", label: "Liquidity" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
