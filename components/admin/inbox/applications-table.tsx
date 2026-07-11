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
import { Textarea } from "@/components/ui/textarea";
import type { Application, ApplicationStatus } from "@/lib/supabase/types";
import { formatGHS } from "@/lib/utils";
import { updateApplicationStatus } from "@/app/admin/(dashboard)/inbox/actions";

const STATUS_VARIANT: Record<ApplicationStatus, "muted" | "gold" | "emerald" | "destructive"> = {
  new: "gold",
  contacted: "muted",
  opened: "emerald",
  rejected: "destructive",
};

export function ApplicationsTable({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Application | null>(null);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => setNotes(selected?.notes ?? ""), [selected]);

  async function changeStatus(id: string, status: ApplicationStatus) {
    const result = await updateApplicationStatus(id, status);
    if (result.ok) {
      toast.success("Status updated.");
      router.refresh();
      setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    } else {
      toast.error(result.error || "Could not update.");
    }
  }

  async function saveNotes() {
    if (!selected) return;
    const result = await updateApplicationStatus(selected.id, selected.status, notes);
    if (result.ok) {
      toast.success("Notes saved.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not save notes.");
    }
  }

  if (applications.length === 0) {
    return <p className="p-8 text-center text-sm text-white/40">No applications yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/50">Reference</TableHead>
            <TableHead className="text-white/50">Name</TableHead>
            <TableHead className="text-white/50">Product</TableHead>
            <TableHead className="text-white/50">Amount</TableHead>
            <TableHead className="text-white/50">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow
              key={app.id}
              className="cursor-pointer border-white/5 hover:bg-white/5"
              onClick={() => setSelected(app)}
            >
              <TableCell className="text-white">{app.reference_code}</TableCell>
              <TableCell className="text-white/70">{app.full_name}</TableCell>
              <TableCell className="capitalize text-white/70">{app.product.replace("-", " ")}</TableCell>
              <TableCell className="text-white/70">{app.amount ? formatGHS(app.amount) : "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[app.status]} className="capitalize">{app.status}</Badge>
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
                <DialogTitle>{selected.full_name} — {selected.reference_code}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">Product:</span> {selected.product}</p>
                <p><span className="text-muted-foreground">Phone:</span> {selected.phone}</p>
                {selected.email ? <p><span className="text-muted-foreground">Email:</span> {selected.email}</p> : null}
                {selected.ghana_card_no ? <p><span className="text-muted-foreground">Ghana Card:</span> {selected.ghana_card_no}</p> : null}
                <p><span className="text-muted-foreground">Town:</span> {selected.town}</p>
                {selected.amount ? <p><span className="text-muted-foreground">Amount:</span> {formatGHS(selected.amount)}{selected.frequency ? ` / ${selected.frequency}` : ""}</p> : null}
                <p><span className="text-muted-foreground">Submitted:</span> {new Date(selected.created_at).toLocaleString("en-GH")}</p>

                <div>
                  <p className="mb-1.5 text-muted-foreground">Status</p>
                  <Select value={selected.status} onValueChange={(v) => changeStatus(selected.id, v as ApplicationStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="opened">Opened</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-1.5 text-muted-foreground">Notes</p>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
