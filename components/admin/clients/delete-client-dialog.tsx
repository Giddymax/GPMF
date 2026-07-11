"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteClient } from "@/app/admin/(dashboard)/operations/clients/actions";

export function DeleteClientDialog({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const canDelete = confirmText.trim() === clientName;

  async function handleDelete() {
    if (!canDelete) return;
    setPending(true);
    const result = await deleteClient(clientId, clientName);
    setPending(false);
    if (result.ok) {
      toast.success(`${clientName} permanently deleted.`);
      setOpen(false);
      setConfirmText("");
      if (pathname.includes(`/clients/${clientId}`)) {
        router.push("/admin/operations/clients");
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.error || "Could not delete client.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setConfirmText(""); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Permanently delete client" className="hover:border-danger-500 hover:text-danger-500">
          <Trash2 className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permanently delete {clientName}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-danger-600">
            This cannot be undone. It permanently removes the client, their accounts, and every
            linked transaction — including ledger history. For a real client with genuine
            activity, use <span className="font-medium">Close</span> instead; this is meant for
            dummy or mis-entered records.
          </p>
          <div>
            <Label htmlFor="confirmDelete">
              Type <span className="font-semibold">{clientName}</span> to confirm
            </Label>
            <Input
              id="confirmDelete"
              className="mt-1.5"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="destructive" disabled={!canDelete || pending} onClick={handleDelete}>
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
