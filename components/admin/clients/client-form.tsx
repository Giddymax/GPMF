"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent } from "@/lib/supabase/types";
import { uploadClientPhoto } from "@/lib/storage/upload-client-photo";
import { PRODUCT_INTEREST_OPTIONS, type NewClientInput } from "@/lib/validation/client";

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}

export function ClientForm({
  agents,
  defaultValues,
  submitLabel,
  submittingLabel,
  onSubmit,
}: {
  agents: Agent[];
  defaultValues?: Partial<NewClientInput>;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (data: NewClientInput) => Promise<void>;
}) {
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(defaultValues?.photoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewClientInput>({ defaultValues: { interestedProducts: [], smsOptIn: true, ...defaultValues } });

  const agentId = watch("agentId");
  const gender = watch("gender");
  const interestedProducts = watch("interestedProducts") ?? [];
  const photoUrl = watch("photoUrl");
  const smsOptIn = watch("smsOptIn");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    const result = await uploadClientPhoto(file);
    setUploadingPhoto(false);
    if (result.ok && result.url) {
      setValue("photoUrl", result.url);
    } else {
      toast.error(result.error || "Could not upload photo.");
      setPhotoPreview(null);
    }
  }

  function toggleProduct(value: string, checked: boolean) {
    const current = interestedProducts;
    setValue(
      "interestedProducts",
      checked ? [...current, value as never] : current.filter((v) => v !== value)
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4">
        <p className="eyebrow text-xs">Identification photo</p>
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- transient blob: preview, not worth next/image's remote pipeline
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="size-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <Input type="file" accept="image/*" onChange={handlePhotoChange} className="max-w-xs" />
            <p className="mt-1 text-xs text-muted-foreground">
              {uploadingPhoto ? "Uploading…" : photoUrl ? "Uploaded." : "Passport-style photo for identification."}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="eyebrow text-xs">Personal information</p>
        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" {...register("fullName", { required: true })} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone", { required: true })} />
          </FormField>
          <FormField label="Email (optional)" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </FormField>
          <FormField label="Date of birth" htmlFor="dateOfBirth">
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </FormField>
          <FormField label="Gender" htmlFor="gender">
            <Select value={gender} onValueChange={(v) => setValue("gender", v as NewClientInput["gender"])}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <FormField label="Occupation (optional)" htmlFor="occupation">
          <Input id="occupation" {...register("occupation")} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={smsOptIn} onCheckedChange={(checked) => setValue("smsOptIn", checked === true)} />
          Send SMS notifications for transactions on this client&apos;s accounts
        </label>
      </section>

      <section className="space-y-4">
        <p className="eyebrow text-xs">Identification</p>
        <FormField label="Ghana Card number" htmlFor="ghanaCardNo" error={errors.ghanaCardNo?.message}>
          <Input id="ghanaCardNo" placeholder="GHA-XXXXXXXXX-X" {...register("ghanaCardNo", { required: true })} />
        </FormField>
      </section>

      <section className="space-y-4">
        <p className="eyebrow text-xs">Location</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Town" htmlFor="town" error={errors.town?.message}>
            <Input id="town" {...register("town", { required: true })} />
          </FormField>
          <FormField label="Region (optional)" htmlFor="region">
            <Input id="region" {...register("region")} />
          </FormField>
          <FormField label="Area / suburb (optional)" htmlFor="area">
            <Input id="area" {...register("area")} />
          </FormField>
          <FormField label="Digital / GPS address (optional)" htmlFor="digitalAddress">
            <Input id="digitalAddress" placeholder="GA-123-4567" {...register("digitalAddress")} />
          </FormField>
        </div>
      </section>

      <section className="space-y-3">
        <p className="eyebrow text-xs">Products interested in</p>
        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_INTEREST_OPTIONS.map((p) => (
            <label key={p.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={interestedProducts.includes(p.value)}
                onCheckedChange={(checked) => toggleProduct(p.value, checked === true)}
              />
              {p.label}
            </label>
          ))}
        </div>
        {errors.interestedProducts ? (
          <p className="text-xs text-danger-600">{errors.interestedProducts.message}</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <p className="eyebrow text-xs">Next of kin</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full name" htmlFor="nextOfKinName" error={errors.nextOfKinName?.message}>
            <Input id="nextOfKinName" {...register("nextOfKinName", { required: true })} />
          </FormField>
          <FormField
            label="Relationship"
            htmlFor="nextOfKinRelationship"
            error={errors.nextOfKinRelationship?.message}
          >
            <Input id="nextOfKinRelationship" placeholder="e.g. Spouse, Parent" {...register("nextOfKinRelationship", { required: true })} />
          </FormField>
          <FormField label="Phone" htmlFor="nextOfKinPhone" error={errors.nextOfKinPhone?.message}>
            <Input id="nextOfKinPhone" {...register("nextOfKinPhone", { required: true })} />
          </FormField>
          <FormField label="Address (optional)" htmlFor="nextOfKinAddress">
            <Input id="nextOfKinAddress" {...register("nextOfKinAddress")} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <p className="eyebrow text-xs">Assignment</p>
        <FormField label="Assigned agent" htmlFor="agentId">
          <Select value={agentId} onValueChange={(v) => setValue("agentId", v)}>
            <SelectTrigger id="agentId">
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
        </FormField>
      </section>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || uploadingPhoto}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
