"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Check, Landmark, PiggyBank, Banknote } from "lucide-react";

import { SusuTinIcon } from "@/components/icons/susu-tin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatGHS } from "@/lib/utils";
import {
  applicationSchema,
  FREQUENCY_OPTIONS,
  PRODUCT_OPTIONS,
  type ApplicationInput,
} from "@/lib/validation/application";
import { submitApplication } from "@/app/(site)/apply/actions";

const PRODUCT_ICONS = {
  savings: PiggyBank,
  "daily-susu": SusuTinIcon,
  "fixed-deposit": Landmark,
  loans: Banknote,
} as const;

const STEPS = ["Product", "Your details", "Amount", "Review"] as const;

const STEP_FIELDS: Record<number, (keyof ApplicationInput)[]> = {
  0: ["product"],
  1: ["fullName", "phone", "email", "ghanaCardNo", "town"],
  2: ["amount", "frequency"],
  3: [],
};

export function ApplyForm({ defaultProduct }: { defaultProduct?: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const initialProduct = PRODUCT_OPTIONS.some((p) => p.value === defaultProduct)
    ? (defaultProduct as ApplicationInput["product"])
    : undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { product: initialProduct, frequency: "daily" },
  });

  const values = watch();
  const needsFrequency = values.product === "daily-susu" || values.product === "loans";

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: ApplicationInput) {
    setSubmitting(true);
    try {
      const result = await submitApplication(data);
      if (result.ok && result.referenceCode) {
        router.push(`/apply/success?ref=${encodeURIComponent(result.referenceCode)}`);
      } else {
        toast.error(result.error || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ol className="mb-10 flex items-center justify-between gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step && "bg-emerald-600 text-white",
                i === step && "bg-gradient-gold text-navy-900",
                i > step && "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span className={cn("hidden text-xs font-medium sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 ? <div className="h-px flex-1 bg-border" /> : null}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 ? (
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Choose a product</legend>
            {PRODUCT_OPTIONS.map((option) => {
              const Icon = PRODUCT_ICONS[option.value];
              const selected = values.product === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                    selected ? "border-gold-500 bg-gold-200/20" : "border-border hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="sr-only"
                    {...register("product")}
                  />
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-gradient-gold text-navy-900">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-medium">{option.label}</span>
                </label>
              );
            })}
            {errors.product ? <p className="text-sm text-danger-600 sm:col-span-2">{errors.product.message}</p> : null}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" className="mt-1.5" {...register("fullName")} />
              {errors.fullName ? <p className="mt-1 text-sm text-danger-600">{errors.fullName.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" placeholder="024XXXXXXX" className="mt-1.5" {...register("phone")} />
              {errors.phone ? <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" className="mt-1.5" {...register("email")} />
              {errors.email ? <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="ghanaCardNo">Ghana Card number (optional)</Label>
              <Input id="ghanaCardNo" placeholder="GHA-XXXXXXXXX-X" className="mt-1.5" {...register("ghanaCardNo")} />
              {errors.ghanaCardNo ? <p className="mt-1 text-sm text-danger-600">{errors.ghanaCardNo.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="town">Town</Label>
              <Input id="town" className="mt-1.5" {...register("town")} />
              {errors.town ? <p className="mt-1 text-sm text-danger-600">{errors.town.message}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">
                {values.product === "daily-susu" ? "Daily amount (GHS)" : "Amount (GHS)"}
              </Label>
              <Input
                id="amount"
                type="number"
                min={1}
                step="0.01"
                className="mt-1.5"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount ? <p className="mt-1 text-sm text-danger-600">{errors.amount.message}</p> : null}
            </div>
            {needsFrequency ? (
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={values.frequency}
                  onValueChange={(v) => setValue("frequency", v as ApplicationInput["frequency"])}
                >
                  <SelectTrigger id="frequency" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3 rounded-lg border border-border p-5">
            <ReviewRow label="Product" value={PRODUCT_OPTIONS.find((p) => p.value === values.product)?.label ?? "—"} />
            <ReviewRow label="Name" value={values.fullName} />
            <ReviewRow label="Phone" value={values.phone} />
            {values.email ? <ReviewRow label="Email" value={values.email} /> : null}
            {values.ghanaCardNo ? <ReviewRow label="Ghana Card" value={values.ghanaCardNo} /> : null}
            <ReviewRow label="Town" value={values.town} />
            <ReviewRow
              label="Amount"
              value={values.amount ? `${formatGHS(Number(values.amount))}${needsFrequency ? ` / ${values.frequency}` : ""}` : "—"}
            />
          </div>
        ) : null}

        <div className="mt-8 flex justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
