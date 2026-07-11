"use client";

import * as React from "react";

import { Container } from "@/components/site/container";
import type { SiteStat } from "@/lib/supabase/types";

function useCountUp(target: number, start: boolean, durationMs = 1400) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs]);

  return value;
}

function StatItem({ stat, start, index }: { stat: SiteStat; start: boolean; index: number }) {
  const value = useCountUp(stat.value, start);
  const isGHS = stat.label.toLowerCase().includes("ghs");

  return (
    <div className="animate-rise text-center" style={{ animationDelay: `${index * 90}ms` }}>
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gradient-gold" />
      <p className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {isGHS ? "GHS " : ""}
        {Math.round(value).toLocaleString()}
        {stat.suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
    </div>
  );
}

export function TrustStatsBar({ stats }: { stats: SiteStat[] }) {
  const [start, setStart] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStart(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-y border-border bg-card py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <StatItem key={stat.id} stat={stat} start={start} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
