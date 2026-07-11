import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { TransactionsTable } from "@/components/admin/ledger/transactions-table";
import { Card } from "@/components/ui/card";
import { getLedgerTransactions } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Ledger" };

export default async function LedgerPage() {
  const transactions = await getLedgerTransactions(150);

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Ledger</h1>
        <p className="mt-1 text-sm text-white/50">
          The {transactions.length} most recent ledger transactions across every product.
        </p>
      </div>

      <Card className="border-white/10 bg-navy-800">
        <TransactionsTable transactions={transactions} />
      </Card>
    </div>
  );
}
