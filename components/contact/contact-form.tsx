"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry";
import { submitInquiry } from "@/app/(site)/contact/actions";

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { subject: defaultSubject ?? "" },
  });

  async function onSubmit(data: InquiryInput) {
    const result = await submitInquiry(data);
    if (result.ok) {
      setSubmitted(true);
      reset();
      toast.success("Message sent — we'll be in touch soon.");
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="font-heading text-lg font-semibold text-emerald-600 dark:text-emerald-500">
          Thank you — message received
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A member of our team will get back to you shortly.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" className="mt-1.5" {...register("name")} />
          {errors.name ? <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" className="mt-1.5" {...register("phone")} />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input id="email" type="email" className="mt-1.5" {...register("email")} />
        {errors.email ? <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" className="mt-1.5" {...register("subject")} />
        {errors.subject ? <p className="mt-1 text-sm text-danger-600">{errors.subject.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} className="mt-1.5" {...register("message")} />
        {errors.message ? <p className="mt-1 text-sm text-danger-600">{errors.message.message}</p> : null}
      </div>
      <Button type="submit" disabled={isSubmitting} className="justify-self-start">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
