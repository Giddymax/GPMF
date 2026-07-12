import { FdEventsDialog } from "@/components/admin/deposits/fd-events-dialog";
import { FdLifecycleActions } from "@/components/admin/deposits/fd-lifecycle-actions";
import { TransactionActions } from "@/components/admin/ledger/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FixedDepositWithClient } from "@/lib/data/admin";
import type { Approval, FdEvent } from "@/lib/supabase/types";
import { formatGHS } from "@/lib/utils";

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function FdMaturityCalendar({
  deposits,
  pendingApprovals,
  events,
}: {
  deposits: FixedDepositWithClient[];
  pendingApprovals: Approval[];
  events: Record<string, FdEvent[]>;
}) {
  if (deposits.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No active or matured fixed deposits.</p>;
  }

  const pendingByFd = new Map(pendingApprovals.filter((a) => a.entity_type === "fixed_deposit").map((a) => [a.entity_id, a]));

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Client</TableHead>
          <TableHead className="text-white/50">FD number</TableHead>
          <TableHead className="text-white/50">Principal</TableHead>
          <TableHead className="text-white/50">Maturity date</TableHead>
          <TableHead className="text-white/50">Status</TableHead>
          <TableHead className="text-white/50" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {deposits.map((fd) => {
          const days = daysUntil(fd.maturity_date);
          return (
            <TableRow key={fd.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-white">{fd.client_name} <span className="text-white/40">({fd.client_code})</span></TableCell>
              <TableCell className="text-white/70">{fd.fd_number}</TableCell>
              <TableCell className="text-white/70">{formatGHS(fd.principal)}</TableCell>
              <TableCell className="text-white/70">{new Date(fd.maturity_date).toLocaleDateString("en-GH")}</TableCell>
              <TableCell>
                {fd.status === "matured" ? (
                  <Badge variant="emerald">Matured</Badge>
                ) : (
                  <Badge variant={days <= 7 ? "gold" : "muted"}>{days} day{days === 1 ? "" : "s"} left</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <FdLifecycleActions fd={fd} pendingApproval={pendingByFd.get(fd.id)} />
                  <FdEventsDialog fdNumber={fd.fd_number} events={events[fd.id] ?? []} />
                  {fd.ledger_transaction_id ? (
                    <TransactionActions transactionId={fd.ledger_transaction_id} label={`${fd.fd_number} booking`} amount={fd.principal} />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
