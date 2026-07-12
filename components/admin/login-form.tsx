"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/app/admin/login/actions";

export function LoginForm({ next }: { next?: string }) {
  const [submitting, setSubmitting] = React.useState(false);

  // Reads straight from FormData (the live DOM values) instead of trusting
  // React-tracked input state — mobile password managers/autofill (iOS
  // Keychain, Chrome autofill) frequently fill a field without firing an
  // event React can see, which left the old react-hook-form version
  // believing the fields were empty and silently blocking submission with
  // no visible error.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      toast.error("Enter both your email and password.");
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password, next);
    setSubmitting(false);
    if (result && !result.ok) {
      toast.error(result.error || "Sign in failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-white/80">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
        />
      </div>
      <div>
        <Label htmlFor="password" className="text-white/80">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
