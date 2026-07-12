"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type SignInResult } from "@/app/admin/login/actions";

const initialState: SignInResult = { ok: true };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
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
      {!state.ok && state.error ? (
        <p className="text-sm text-danger-500" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
