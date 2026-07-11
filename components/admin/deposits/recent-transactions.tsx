import { TransactionActions } from "@/components/admin/ledger/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecentSavingsTransactionRow } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";

export function RecentTransactions({ transactions }: { transactions: RecentSavingsTransactionRow[] }) {
  if (transactions.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No savings transactions recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Client</TableHead>
          <TableHead className="text-white/50">Type</TableHead>
          <TableHead className="text-white/50">Date</TableHead>
          <TableHead className="text-white/50">Amount</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id} className="border-white/5 hover:bg-white/5">
            <TableCell className="text-white">
              {t.client_name} <span className="text-white/40">({t.client_code})</span>
            </TableCell>
            <TableCell>
              <Badge variant={t.type === "withdrawal" ? "destructive" : "emerald"} className="capitalize">{t.type}</Badge>
            </TableCell>
            <TableCell className="text-white/70">{new Date(t.created_at).toLocaleString("en-GH")}</TableCell>
            <TableCell className="text-white/70">{formatGHS(t.amount)}</TableCell>
            <TableCell>
              {t.ledger_transaction_id ? (
                <TransactionActions
                  transactionId={t.ledger_transaction_id}
                  label={`Savings ${t.type} — ${t.client_name}`}
                  amount={t.amount}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
