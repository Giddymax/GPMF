"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parBucket, provision } from "@/lib/finance";
import type { ArrearsRow } from "@/lib/data/admin";
import { formatGHS } from "@/lib/utils";
import { addArrearsNote } from "@/app/admin/(dashboard)/operations/loans/actions";

export function ArrearsQueue({ rows }: { rows: ArrearsRow[] }) {
  const router = useRouter();
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState<string | null>(null);

  async function submitNote(loanId: string) {
    const note = notes[loanId];
    if (!note) return;
    setPending(loanId);
    const result = await addArrearsNote(loanId, note);
    setPending(null);
    if (result.ok) {
      toast.success("Follow-up note added.");
      setNotes((n) => ({ ...n, [loanId]: "" }));
      router.refresh();
    } else {
      toast.error(result.error || "Could not add note.");
    }
  }

  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No loans in arrears — clean book.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-white/50">Loan</TableHead>
          <TableHead className="text-white/50">Days past due</TableHead>
          <TableHead className="text-white/50">Bucket</TableHead>
          <TableHead className="text-white/50">Outstanding</TableHead>
          <TableHead className="text-white/50">Provision</TableHead>
          <TableHead className="text-white/50">Follow-up note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.loan_id} className="border-white/5 hover:bg-white/5">
            <TableCell>
              <Link href={`/admin/operations/loans/${row.loan_id}`} className="font-medium text-white hover:text-gold-500">
                {row.loan_number}
              </Link>
              <p className="text-xs text-white/40">{row.party_name}</p>
            </TableCell>
            <TableCell className="text-white/70">{row.days_past_due}</TableCell>
            <TableCell>
              <Badge variant="destructive" className="capitalize">{parBucket(row.days_past_due)}</Badge>
            </TableCell>
            <TableCell className="text-white/70">{formatGHS(row.outstanding_principal)}</TableCell>
            <TableCell className="text-white/70">{formatGHS(provision(row.outstanding_principal, row.days_past_due))}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Textarea
                  className="h-9 min-h-0 w-48 py-1.5 text-xs"
                  value={notes[row.loan_id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [row.loan_id]: e.target.value }))}
                  placeholder="Add a note…"
                />
                <Button size="sm" disabled={pending === row.loan_id} onClick={() => submitNote(row.loan_id)}>
                  Save
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
