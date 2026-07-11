import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/login-form";
import { LogoIcon } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Staff login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-gradient-navy px-4 py-16 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoIcon className="h-14 w-14" />
          <p className="mt-4 font-heading text-lg font-semibold tracking-wide text-white">
            GRAINY PALACE
          </p>
          <p className="eyebrow mt-1 text-white/50">Staff &amp; administrators only</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-navy-800/60 p-6 shadow-2xl backdrop-blur">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Not staff? Return to the{" "}
          <a href="/" className="text-gold-500 hover:underline">
            public site
          </a>
          .
        </p>
      </div>
    </div>
  );
}
