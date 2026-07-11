import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FixedDepositWithClient } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function FdMaturityCalendar({ deposits }: { deposits: FixedDepositWithClient[] }) {
  if (deposits.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No active fixed deposits.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Client</TableHead>
          <TableHead className="text-white/50">FD number</TableHead>
          <TableHead className="text-white/50">Principal</TableHead>
          <TableHead className="text-white/50">Maturity date</TableHead>
          <TableHead className="text-white/50">Days left</TableHead>
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
                <Badge variant={days <= 7 ? "gold" : "muted"}>{days} day{days === 1 ? "" : "s"}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
