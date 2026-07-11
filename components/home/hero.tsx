import Link from "next/link";
import { ShieldCheck, TrendingUp } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { formatGHS } from "@/lib/utils";

export function Hero() {
  const collectedToday = 42300;

  return (
    <section className="relative overflow-hidden bg-gradient-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #D4AF37 0, #D4AF37 1px, transparent 1px, transparent 64px)",
        }}
        aria-hidden="true"
      />
      <Container className="relative py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-rise">
            <p className="eyebrow text-gold-200/90">Licensed last-mile financial services</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Save a little every day.
              <span className="block text-gradient-gold">Build something big.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg">
              Daily susu, savings, fixed deposits and micro-loans — brought to your stall, your
              shop, your doorstep. As trustworthy as a bank, as familiar as your local susu
              collector.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/apply">Open an Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link href="/products/daily-susu">See how susu works</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="size-5 text-gold-500" />
              Licensed &amp; regulated · Bank of Ghana registered Last-Mile Provider
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-rise" style={{ animationDelay: "120ms" }}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <p className="eyebrow text-white/60">Live today</p>
              <p className="mt-2 font-heading text-3xl font-semibold">
                {formatGHS(collectedToday)}
              </p>
              <p className="mt-1 text-sm text-white/70">Susu collected across our routes</p>
              <div className="mt-4 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-500 w-fit">
                <TrendingUp className="size-4" />
                +8.4% vs yesterday
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-white/10 bg-navy-800/90 px-4 py-3 shadow-xl backdrop-blur sm:block">
              <p className="text-xs text-white/60">Cycle progress, avg. client</p>
              <p className="font-heading text-lg font-semibold text-gold-500">Day 22 of 31</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
