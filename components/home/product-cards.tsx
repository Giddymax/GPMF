import Link from "next/link";
import { ArrowRight, Banknote, Landmark, PiggyBank } from "lucide-react";

import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { SusuTinIcon } from "@/components/icons/susu-tin";
import { Card, CardContent } from "@/components/ui/card";

const products = [
  {
    icon: PiggyBank,
    title: "Savings",
    description: "Open with as little as GHS 20 and earn interest on every cedi you keep with us.",
    href: "/products/savings",
  },
  {
    icon: SusuTinIcon,
    title: "Daily Susu",
    description: "A collector visits your stall every day. After 31 days, your money comes home.",
    href: "/products/daily-susu",
  },
  {
    icon: Landmark,
    title: "Fixed Deposit",
    description: "Lock in a lump sum for 3, 6 or 12 months and earn our best rates.",
    href: "/products/fixed-deposit",
  },
  {
    icon: Banknote,
    title: "Micro-Loans",
    description: "Your savings history is your credit score — borrow to grow your business.",
    href: "/products/loans",
  },
];

export function ProductCards() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          eyebrow="Our products"
          title="Four ways to save, one place to grow"
          description="Every product feeds the next — your deposits fund the loans that help your neighbours, and their repayments keep your savings safe."
          align="center"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Card key={p.title} className="group transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-gold text-navy-900">
                  <p.icon className="size-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <Link
                  href={p.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:gap-2 transition-all dark:text-gold-500"
                >
                  Learn more <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
