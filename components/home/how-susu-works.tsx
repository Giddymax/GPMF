import { CalendarCheck, HandCoins, Wallet } from "lucide-react";

import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";

const steps = [
  {
    icon: HandCoins,
    title: "1. Choose your daily amount",
    description: "From GHS 1 to GHS 200 a day — whatever fits your trade. Our agent registers you with your Ghana Card on the spot.",
  },
  {
    icon: CalendarCheck,
    title: "2. We collect it, every day",
    description: "For 31 days, your agent visits your stall or shop, collects your contribution, and gives you an instant receipt.",
  },
  {
    icon: Wallet,
    title: "3. Get your lump sum back",
    description: "At the end of the cycle, you receive everything you saved minus one day's contribution — our only fee. Roll over or withdraw.",
  },
];

export function HowSusuWorks() {
  return (
    <section id="how-susu-works" className="scroll-mt-20 bg-card py-20">
      <Container>
        <SectionHeading
          eyebrow="How daily susu works"
          title="Discipline, one visit at a time"
          description="Susu has worked in Ghanaian markets for generations. We just make it safer, with receipts and a real ledger behind every cedi."
          align="center"
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="animate-rise text-center" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-gradient-navy text-gold-500">
                <step.icon className="size-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
