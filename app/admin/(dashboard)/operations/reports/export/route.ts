import { NextResponse } from "next/server";

import {
  getAgentCashBalances,
  getAgents,
  getArrearsQueue,
  getGlTrialBalance,
  getRatioHistory,
} from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";

function toCsv(header: string[], rows: (string | number)[][]) {
  return [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "ratios";

  let csv = "";
  let filename = `${type}.csv`;

  if (type === "cash-summary") {
    const [agents, balances] = await Promise.all([getAgents(), getAgentCashBalances()]);
    const byAgent = new Map(balances.map((b) => [b.agent_id, b.cash_on_hand]));
    csv = toCsv(
      ["Agent", "Employee code", "Cash on hand (GHS)"],
      agents.map((a) => [a.full_name, a.employee_code, byAgent.get(a.id) ?? 0])
    );
    filename = "daily-cash-summary.csv";
  } else if (type === "ratios") {
    const history = await getRatioHistory(24);
    csv = toCsv(
      ["Snapshot date", "OSS", "FSS", "ROA", "ROE", "Portfolio yield", "PAR30", "Risk coverage", "OER", "Liquidity", "Loan-to-deposit", "Net income"],
      history.map((r) => [
        r.snapshot_date,
        r.oss ?? "",
        r.fss ?? "",
        r.roa ?? "",
        r.roe ?? "",
        r.portfolio_yield ?? "",
        r.par30 ?? "",
        r.risk_coverage_ratio ?? "",
        r.operating_expense_ratio ?? "",
        r.liquidity_ratio ?? "",
        r.loan_to_deposit_ratio ?? "",
        r.net_income ?? "",
      ])
    );
    filename = "seep-cgap-ratio-pack.csv";
  } else if (type === "portfolio-quality") {
    const arrears = await getArrearsQueue();
    csv = toCsv(
      ["Loan", "Client/Group", "Days past due", "Outstanding (GHS)"],
      arrears.map((a) => [a.loan_number, a.party_name, a.days_past_due, a.outstanding_principal])
    );
    filename = "portfolio-quality.csv";
  } else if (type === "deposit-book") {
    const supabase = await createClient();
    const { data } = await supabase.from("account_balances").select("*, clients(full_name, client_code)");
    csv = toCsv(
      ["Client", "Client code", "Account type", "Balance (GHS)"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((r: any) => [r.clients?.full_name ?? "—", r.clients?.client_code ?? "—", r.account_type, r.balance])
    );
    filename = "deposit-book.csv";
  } else if (type === "trial-balance") {
    const rows = await getGlTrialBalance();
    csv = toCsv(
      ["GL code", "Account", "Class", "Balance (GHS)"],
      rows.map((r) => [r.code, r.name, r.class, r.balance])
    );
    filename = "trial-balance.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
