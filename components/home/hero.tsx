import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export function Hero() {
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
        <div className="mx-auto max-w-2xl text-center animate-rise">
          <p className="eyebrow text-gold-200/90">Licensed last-mile financial services</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Save a little every day.
            <span className="block text-gradient-gold">Build something big.</span>
          </h1>
          <p className="mt-6 text-base text-white/80 sm:text-lg">
            Daily susu, savings, fixed deposits and micro-loans — brought to your stall, your
            shop, your doorstep. As trustworthy as a bank, as familiar as your local susu
            collector.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/apply">Open an Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/products/daily-susu">See how susu works</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/70">
            <ShieldCheck className="size-5 text-gold-500" />
            Licensed &amp; regulated · Bank of Ghana registered Last-Mile Provider
          </div>
        </div>
      </Container>
    </section>
  );
}
