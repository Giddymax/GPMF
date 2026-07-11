"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NewClientInput } from "@/lib/validation/client";
import type { Agent } from "@/lib/supabase/types";
import { createNewClient } from "@/app/admin/(dashboard)/operations/clients/actions";

export function NewClientDialog({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<NewClientInput>();
  const agentId = watch("agentId");

  async function onSubmit(data: NewClientInput) {
    const result = await createNewClient(data);
    if (result.ok) {
      toast.success("Client created.");
      reset();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a new client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" className="mt-1.5" {...register("fullName", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" className="mt-1.5" {...register("phone", { required: true })} />
            </div>
            <div>
              <Label htmlFor="town">Town</Label>
              <Input id="town" className="mt-1.5" {...register("town", { required: true })} />
            </div>
          </div>
          <div>
            <Label htmlFor="ghanaCardNo">Ghana Card number</Label>
            <Input id="ghanaCardNo" placeholder="GHA-XXXXXXXXX-X" className="mt-1.5" {...register("ghanaCardNo")} />
          </div>
          <div>
            <Label htmlFor="agentId">Assigned agent</Label>
            <Select value={agentId} onValueChange={(v) => setValue("agentId", v)}>
              <SelectTrigger id="agentId" className="mt-1.5">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name} ({a.employee_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
