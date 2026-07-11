"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { ClientForm } from "@/components/admin/clients/client-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Agent } from "@/lib/supabase/types";
import type { NewClientInput } from "@/lib/validation/client";
import { createNewClient } from "@/app/admin/(dashboard)/operations/clients/actions";

export function NewClientDialog({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  async function onSubmit(data: NewClientInput) {
    const result = await createNewClient(data);
    if (result.ok) {
      toast.success("Client created.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Could not create client.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register a new client</DialogTitle>
        </DialogHeader>
        <ClientForm agents={agents} submitLabel="Create client" submittingLabel="Creating…" onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}
