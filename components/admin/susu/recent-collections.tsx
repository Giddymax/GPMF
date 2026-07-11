import { TransactionActions } from "@/components/admin/ledger/transaction-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecentSusuContributionRow } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";

export function RecentCollections({ contributions }: { contributions: RecentSusuContributionRow[] }) {
  if (contributions.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No collections recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Client</TableHead>
          <TableHead className="text-white/50">Collected</TableHead>
          <TableHead className="text-white/50">Amount</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {contributions.map((c) => (
          <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
            <TableCell className="text-white">
              {c.client_name} <span className="text-white/40">({c.client_code})</span>
            </TableCell>
            <TableCell className="text-white/70">{new Date(c.collected_at).toLocaleString("en-GH")}</TableCell>
            <TableCell className="text-white/70">{formatGHS(c.amount)}</TableCell>
            <TableCell>
              {c.ledger_transaction_id ? (
                <TransactionActions
                  transactionId={c.ledger_transaction_id}
                  label={`Susu collection — ${c.client_name}`}
                  amount={c.amount}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
