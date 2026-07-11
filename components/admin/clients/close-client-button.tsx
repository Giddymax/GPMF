"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { closeClient } from "@/app/admin/(dashboard)/operations/clients/actions";

export function CloseClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleClose() {
    if (!confirm(`Close ${clientName}'s account? Their accounts, ledger history and statements stay intact — this only marks them inactive and hides them from the default client list.`)) {
      return;
    }
    setPending(true);
    const result = await closeClient(clientId);
    setPending(false);
    if (result.ok) {
      toast.success(`${clientName} closed.`);
      router.refresh();
    } else {
      toast.error(result.error || "Could not close client.");
    }
  }

  return (
    <Button size="sm" variant="outline" title="Close client" disabled={pending} onClick={handleClose}>
      <UserX className="size-3.5" />
    </Button>
  );
}
