"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { ClientForm } from "@/components/admin/clients/client-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Agent, Client } from "@/lib/supabase/types";
import type { NewClientInput } from "@/lib/validation/client";
import { updateClient } from "@/app/admin/(dashboard)/operations/clients/actions";

function toFormValues(client: Client): Partial<NewClientInput> {
  return {
    fullName: client.full_name,
    phone: client.phone ?? "",
    smsOptIn: client.sms_opt_in,
    email: client.email ?? "",
    dateOfBirth: client.date_of_birth ?? "",
    gender: (client.gender as NewClientInput["gender"]) ?? undefined,
    occupation: client.occupation ?? "",
    ghanaCardNo: client.ghana_card_no ?? "",
    photoUrl: client.photo_url ?? "",
    town: client.town ?? "",
    region: client.region ?? "",
    area: client.area ?? "",
    digitalAddress: client.digital_address ?? "",
    interestedProducts: (client.interested_products ?? []) as NewClientInput["interestedProducts"],
    nextOfKinName: client.next_of_kin_name ?? "",
    nextOfKinRelationship: client.next_of_kin_relationship ?? "",
    nextOfKinPhone: client.next_of_kin_phone ?? "",
    nextOfKinAddress: client.next_of_kin_address ?? "",
    agentId: client.agent_id ?? "",
  };
}

export function EditClientDialog({ client, agents }: { client: Client; agents: Agent[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  async function onSubmit(data: NewClientInput) {
    const result = await updateClient(client.id, data);
    if (result.ok) {
      toast.success("Client updated.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Could not update client.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" title="Edit client">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {client.full_name}</DialogTitle>
        </DialogHeader>
        {open ? (
          <ClientForm
            agents={agents}
            defaultValues={toFormValues(client)}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
