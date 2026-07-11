"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/app/admin/login/actions";

interface LoginValues {
  email: string;
  password: string;
}

export function LoginForm({ next }: { next?: string }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>();

  async function onSubmit(values: LoginValues) {
    const result = await signIn(values.email, values.password, next);
    if (result && !result.ok) {
      toast.error(result.error || "Sign in failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-white/80">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
          {...register("email", { required: true })}
        />
      </div>
      <div>
        <Label htmlFor="password" className="text-white/80">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
          {...register("password", { required: true })}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
