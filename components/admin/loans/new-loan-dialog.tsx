"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { ClientSearch } from "@/components/admin/client-search";
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
import { createLoanApplication } from "@/app/admin/(dashboard)/operations/loans/actions";

interface FormValues {
  principal: number;
  termMonths: number;
  frequency: "daily" | "weekly" | "monthly";
}

export function NewLoanDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [client, setClient] = React.useState<{ id: string; label: string } | null>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { termMonths: 3, frequency: "weekly" },
  });
  const frequency = watch("frequency");

  async function onSubmit(values: FormValues) {
    if (!client) {
      toast.error("Select a client first.");
      return;
    }
    const result = await createLoanApplication({
      clientId: client.id,
      principal: Number(values.principal),
      termMonths: Number(values.termMonths),
      frequency: values.frequency,
    });
    if (result.ok) {
      toast.success("Loan application created.");
      reset();
      setClient(null);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Could not create application.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New loan application
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New individual loan application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Client</Label>
            <div className="mt-1.5">
              <ClientSearch onSelect={setClient} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principal">Principal (GHS)</Label>
              <Input id="principal" type="number" min={50} className="mt-1.5" {...register("principal", { required: true, valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="termMonths">Term (months)</Label>
              <Input id="termMonths" type="number" min={1} max={12} className="mt-1.5" {...register("termMonths", { required: true, valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label htmlFor="frequency">Repayment frequency</Label>
            <Select value={frequency} onValueChange={(v) => setValue("frequency", v as FormValues["frequency"])}>
              <SelectTrigger id="frequency" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !client}>
              {isSubmitting ? "Creating…" : "Create application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
