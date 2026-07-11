"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cyclePayout, maturityValue, SUSU_CYCLE_DAYS } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

const DURATIONS = [3, 6, 12] as const;
const FD_RATE_BY_MONTHS: Record<number, number> = { 3: 0.1, 6: 0.12, 12: 0.14 };

function buildProjection(daily: number, months: number) {
  const totalDays = months * 30;
  const points: { month: number; susu: number; fixedDeposit: number }[] = [{ month: 0, susu: 0, fixedDeposit: 0 }];

  let dayCursor = 0;
  let susuTotal = 0;
  const lumpSum = daily * 30; // one month's saving, deposited as a lump sum for the FD comparison
  const fdRate = FD_RATE_BY_MONTHS[months] ?? 0.1;

  for (let m = 1; m <= months; m++) {
    dayCursor += 30;
    const completedCycles = Math.floor(dayCursor / SUSU_CYCLE_DAYS);
    const remainderDays = dayCursor - completedCycles * SUSU_CYCLE_DAYS;
    susuTotal = completedCycles * cyclePayout(daily, SUSU_CYCLE_DAYS) + remainderDays * daily;

    const fdValue = maturityValue(lumpSum, fdRate, m) - lumpSum + lumpSum; // interest accrues from month 1
    points.push({ month: m, susu: Math.round(susuTotal), fixedDeposit: Math.round(fdValue) });
  }

  return points;
}

export function SavingsCalculator() {
  const [daily, setDaily] = React.useState(20);
  const [months, setMonths] = React.useState<(typeof DURATIONS)[number]>(6);

  const data = React.useMemo(() => buildProjection(daily, months), [daily, months]);
  const final = data[data.length - 1];

  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          eyebrow="Plan ahead"
          title="See what daily saving adds up to"
          description="Slide to your daily amount and pick a duration — compare susu against locking the same money into a fixed deposit."
          align="center"
        />

        <Card className="mt-12 overflow-hidden">
          <CardContent className="grid gap-10 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <label htmlFor="daily-amount" className="text-sm font-medium">
                    Daily amount
                  </label>
                  <span className="font-heading text-xl font-semibold text-gold-700 dark:text-gold-500">
                    {formatGHS(daily)}
                  </span>
                </div>
                <Slider
                  id="daily-amount"
                  min={1}
                  max={200}
                  step={1}
                  value={[daily]}
                  onValueChange={([v]) => setDaily(v)}
                  aria-label="Daily susu amount in GHS"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Duration</p>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setMonths(d)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        months === d
                          ? "border-gold-500 bg-gradient-gold text-navy-900"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {d} months
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Susu payout after {months} months</span>
                  <span className="font-heading font-semibold text-emerald-600 dark:text-emerald-500">
                    {formatGHS(final.susu)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Same amount in a fixed deposit</span>
                  <span className="font-heading font-semibold">{formatGHS(final.fixedDeposit)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Illustrative only. Susu commission is one day&apos;s contribution per completed
                31-day cycle; fixed deposit comparison assumes the first month&apos;s savings placed
                as a lump sum at the {months}-month rate.
              </p>
            </div>

            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="susuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v / 100) / 10}k`}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatGHS(Number(value ?? 0)),
                      name === "susu" ? "Susu" : "Fixed deposit",
                    ]}
                    labelFormatter={(m) => `Month ${m}`}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="fixedDeposit" stroke="#D4AF37" strokeWidth={2} fill="url(#fdGradient)" />
                  <Area type="monotone" dataKey="susu" stroke="#10B981" strokeWidth={2.5} fill="url(#susuGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
