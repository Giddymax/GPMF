import type { Metadata } from "next";
import { Landmark } from "lucide-react";

import { ProductDetail } from "@/components/products/product-detail";
import { getFaqs, getRates } from "@/lib/data/public";
import { fdInterestEarned, maturityValue } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fixed Deposits",
  description: "Lock in a lump sum with Grainy Palace for 3, 6 or 12 months and earn our best interest rates.",
};

export default async function FixedDepositPage() {
  const [rates, faqs] = await Promise.all([getRates("fixed-deposit"), getFaqs("rates")]);
  const twelveMonthRate = rates.find((r) => r.term_months === 12)?.rate ?? 0.14;
  const principal = 2000;
  const maturity = maturityValue(principal, twelveMonthRate, 12);
  const interest = fdInterestEarned(principal, twelveMonthRate, 12);

  return (
    <ProductDetail
      content={{
        icon: Landmark,
        eyebrow: "fixed-deposit",
        title: "Fixed Deposits",
        tagline: "Have a lump sum to set aside? Lock it in for a fixed term and earn our best rates — from 10% to 14% per year.",
        features: [
          { title: "Choose your term", description: "3, 6 or 12 months — the longer the term, the higher the rate." },
          { title: "Guaranteed rate", description: "Your rate is fixed for the full term, whatever happens to market rates." },
          { title: "Simple interest, paid at maturity", description: "Know exactly what you'll receive on day one." },
          { title: "Early access if you need it", description: "Break your deposit early and we recalculate at the savings rate for the days held." },
        ],
        requirements: [
          "Valid Ghana Card",
          "One passport-sized photograph",
          "Minimum deposit of GHS 500",
          "An existing Grainy Palace savings account to receive your payout",
        ],
        workedExample: {
          title: `${formatGHS(principal)} locked in for 12 months`,
          steps: [
            { label: "Principal", value: formatGHS(principal) },
            { label: "Rate (12 months)", value: `${(twelveMonthRate * 100).toFixed(1)}% p.a.` },
            { label: "Interest earned", value: formatGHS(interest) },
            { label: "Maturity value", value: formatGHS(maturity) },
          ],
          note: "Simple interest: principal x (1 + rate x months / 12).",
        },
        rates,
        faqs,
      }}
    />
  );
}
