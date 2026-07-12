"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import type { HeroSlide } from "@/lib/supabase/types";

const AUTOPLAY_MS = 7000;

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-gradient-navy text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
          aria-hidden={i !== index}
        >
          {slide.image_url ? (
            <>
              <Image
                src={slide.image_url}
                alt=""
                fill
                priority={i === 0}
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/70 to-navy-900/90" />
            </>
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #D4AF37 0, #D4AF37 1px, transparent 1px, transparent 64px)",
            }}
            aria-hidden="true"
          />
        </div>
      ))}

      <Container className="relative py-20 sm:py-28">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="mx-auto max-w-2xl text-center transition-opacity duration-700 ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              position: i === index ? "relative" : "absolute",
              inset: i === index ? undefined : 0,
              pointerEvents: i === index ? "auto" : "none",
            }}
            aria-hidden={i !== index}
          >
            {slide.eyebrow ? <p className="eyebrow text-gold-200/90">{slide.eyebrow}</p> : null}
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {slide.headline}
            </h1>
            {slide.subheading ? <p className="mt-6 text-base text-white/80 sm:text-lg">{slide.subheading}</p> : null}
            {slide.primary_cta_label && slide.primary_cta_href ? (
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href={slide.primary_cta_href}>{slide.primary_cta_label}</Link>
                </Button>
                {slide.secondary_cta_label && slide.secondary_cta_href ? (
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                    <Link href={slide.secondary_cta_href}>{slide.secondary_cta_label}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/70">
              <ShieldCheck className="size-5 text-gold-500" />
              Licensed &amp; regulated · Bank of Ghana registered Last-Mile Provider
            </div>
          </div>
        ))}

        {slides.length > 1 ? (
          <div className="relative mt-10 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-gold-500" : "w-2 bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
