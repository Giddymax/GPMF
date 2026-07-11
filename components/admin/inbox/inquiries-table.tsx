"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Inquiry, InquiryStatus } from "@/lib/supabase/types";
import { updateInquiryStatus } from "@/app/admin/(dashboard)/inbox/actions";

const STATUS_VARIANT: Record<InquiryStatus, "muted" | "gold" | "emerald"> = {
  new: "gold",
  contacted: "muted",
  resolved: "emerald",
};

export function InquiriesTable({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Inquiry | null>(null);

  async function changeStatus(id: string, status: InquiryStatus) {
    const result = await updateInquiryStatus(id, status);
    if (result.ok) {
      toast.success("Status updated.");
      router.refresh();
      setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    } else {
      toast.error(result.error || "Could not update.");
    }
  }

  if (inquiries.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No inquiries yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/50">Name</TableHead>
            <TableHead className="text-white/50">Subject</TableHead>
            <TableHead className="text-white/50">Received</TableHead>
            <TableHead className="text-white/50">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((inq) => (
            <TableRow key={inq.id} className="cursor-pointer border-white/5 hover:bg-white/5" onClick={() => setSelected(inq)}>
              <TableCell className="text-white">{inq.name}</TableCell>
              <TableCell className="text-white/70">{inq.subject}</TableCell>
              <TableCell className="text-white/70">{new Date(inq.created_at).toLocaleDateString("en-GH")}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[inq.status]} className="capitalize">{inq.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name} — {selected.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selected.phone ? <p><span className="text-muted-foreground">Phone:</span> {selected.phone}</p> : null}
                {selected.email ? <p><span className="text-muted-foreground">Email:</span> {selected.email}</p> : null}
                <p className="whitespace-pre-wrap">{selected.message}</p>
                <p className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString("en-GH")}</p>

                <div>
                  <p className="mb-1.5 text-muted-foreground">Status</p>
                  <Select value={selected.status} onValueChange={(v) => changeStatus(selected.id, v as InquiryStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
