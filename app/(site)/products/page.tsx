import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Banknote, Landmark, PiggyBank } from "lucide-react";

import { SusuTinIcon } from "@/components/icons/susu-tin";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Products",
  description: "Savings, daily susu, fixed deposits and micro-loans — every product Grainy Palace Financial Service offers.",
};

const products = [
  { icon: PiggyBank, title: "Savings", href: "/products/savings", description: "Everyday saving with modest interest and easy access." },
  { icon: SusuTinIcon, title: "Daily Susu", href: "/products/daily-susu", description: "A collector visits you daily; withdraw or roll over after 31 days." },
  { icon: Landmark, title: "Fixed Deposit", href: "/products/fixed-deposit", description: "Lock in a lump sum for 3, 6 or 12 months at our best rates." },
  { icon: Banknote, title: "Micro-Loans", href: "/products/loans", description: "Your savings record is your credit score." },
];

export default function ProductsPage() {
  return (
    <>
      <section className="bg-gradient-navy py-20 text-white">
        <Container>
          <p className="eyebrow text-gold-200/90">Products</p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
            Four products, one goal: your financial security
          </h1>
          <p className="mt-4 max-w-xl text-white/80">
            Whichever stage of saving you're at, there's a Grainy Palace product built for it.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Choose your product" title="Compare and pick what fits" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {products.map((p) => (
              <Link key={p.href} href={p.href}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-gold text-navy-900">
                      <p.icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold">{p.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-700 dark:text-gold-500">
                        Learn more <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
