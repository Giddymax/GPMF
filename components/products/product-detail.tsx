import Link from "next/link";
import { Check, FileText } from "lucide-react";

import { CtaBand } from "@/components/home/cta-band";
import { Container } from "@/components/site/container";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Faq, Rate } from "@/lib/supabase/types";

export interface ProductDetailContent {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  tagline: string;
  features: { title: string; description: string }[];
  requirements: string[];
  workedExample: { title: string; steps: { label: string; value: string }[]; note?: string };
  rates: Rate[];
  faqs: Faq[];
}

function formatRateUnit(unit: string) {
  switch (unit) {
    case "pa":
      return "% per year";
    case "flat_monthly":
      return "% flat per month";
    case "pct_of_principal":
      return "% of principal";
    case "monthly_of_collections":
      return "of monthly collections";
    default:
      return unit;
  }
}

export function ProductDetail({ content }: { content: ProductDetailContent }) {
  const Icon = content.icon;

  return (
    <>
      <section className="bg-gradient-navy py-20 text-white">
        <Container>
          <div className="flex items-center gap-3">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-gold text-navy-900">
              <Icon className="size-6" />
            </div>
            <p className="eyebrow text-gold-200/90">{content.eyebrow}</p>
          </div>
          <h1 className="mt-4 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-xl text-white/80">{content.tagline}</p>
          <Button size="lg" className="mt-8" asChild>
            <Link href={`/apply?product=${encodeURIComponent(content.eyebrow)}`}>Apply now</Link>
          </Button>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Features" title="What you get" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.features.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <div className="mb-3 inline-flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500">
                    <Check className="size-4.5" />
                  </div>
                  <h3 className="font-heading font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-card py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Getting started" title="What you'll need" />
            <ul className="mt-6 space-y-3">
              {content.requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm text-foreground">
                  <FileText className="mt-0.5 size-4 shrink-0 text-gold-700 dark:text-gold-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading eyebrow="Worked example" title={content.workedExample.title} />
            <Card className="mt-6">
              <CardContent className="divide-y divide-border pt-6">
                {content.workedExample.steps.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-heading font-semibold">{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {content.workedExample.note ? (
              <p className="mt-3 text-xs text-muted-foreground">{content.workedExample.note}</p>
            ) : null}
          </div>
        </Container>
      </section>

      {content.rates.length > 0 ? (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow="Current rates" title="Published rates" align="center" />
            <Card className="mx-auto mt-10 max-w-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.rates.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {(r.rate * 100).toFixed(1)}{formatRateUnit(r.unit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Container>
        </section>
      ) : null}

      {content.faqs.length > 0 ? (
        <section className="bg-card py-20">
          <Container>
            <SectionHeading eyebrow="Questions" title="Frequently asked questions" align="center" />
            <div className="mt-10">
              <FaqAccordion faqs={content.faqs} />
            </div>
          </Container>
        </section>
      ) : null}

      <CtaBand />
    </>
  );
}
