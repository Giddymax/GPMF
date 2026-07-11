import type { Metadata } from "next";
import { Download } from "lucide-react";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Reports" };

const reports = [
  { type: "cash-summary", title: "Daily cash summary", description: "Cash on hand per agent, from the ledger — always current." },
  { type: "ratios", title: "SEEP/CGAP ratio pack", description: "Full monthly ratio history for board and regulator reporting." },
  { type: "portfolio-quality", title: "Portfolio quality", description: "Every loan currently in arrears, with days past due and outstanding balance." },
  { type: "deposit-book", title: "Deposit book", description: "Every savings and susu account balance, by client." },
  { type: "trial-balance", title: "Trial balance", description: "Full general ledger trial balance — the monthly P&L and balance sheet source." },
];

export default function ReportsPage() {
  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Reports</h1>
        <p className="mt-1 text-sm text-white/50">
          Export CSVs for board packs, regulator returns, and agent performance reviews. For live
          numbers, see the Dashboard and Treasury pages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.type} className="border-white/10 bg-navy-800">
            <CardHeader>
              <CardTitle className="text-white">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/60">{report.description}</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href={`/admin/operations/reports/export?type=${report.type}`}>
                  <Download className="size-4" /> Download CSV
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-white/10 bg-navy-800">
        <CardHeader>
          <CardTitle className="text-white">Month-end regulator pack</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/60">
          Combine the SEEP/CGAP ratio pack, portfolio quality and trial balance exports above for
          your monthly Bank of Ghana / Last-Mile Provider supervisor return. The EOM close job
          (see <code className="rounded bg-white/10 px-1 py-0.5 text-xs">run_eom_close()</code> in
          the Supabase migration) snapshots ratios automatically at month end.
        </CardContent>
      </Card>
    </div>
  );
}
