import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { TransactionsTable } from "@/components/admin/ledger/transactions-table";
import { Card } from "@/components/ui/card";
import { getLedgerEntriesForTransactions, getLedgerTransactions } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Ledger" };

export default async function LedgerPage() {
  const transactions = await getLedgerTransactions(150);
  const legsByTransaction = await getLedgerEntriesForTransactions(transactions.map((t) => t.id));

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
        <TransactionsTable transactions={transactions} legsByTransaction={legsByTransaction} />
      </Card>
    </div>
  );
}
