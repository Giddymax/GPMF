import type { Metadata } from "next";
import { Banknote } from "lucide-react";

import { ProductDetail } from "@/components/products/product-detail";
import { getFaqs, getRates } from "@/lib/data/public";
import { installment, processingFee, totalRepayable } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Micro-Loans",
  description: "Borrow against your savings or susu record with Grainy Palace's individual and group micro-loans.",
};

export default async function LoansPage() {
  const [rates, faqs] = await Promise.all([getRates("loans"), getFaqs("loans")]);
  const monthlyRate = rates.find((r) => r.unit === "flat_monthly")?.rate ?? 0.045;
  const principal = 500;
  const months = 3;
  const total = totalRepayable(principal, monthlyRate, months);
  const fee = processingFee(principal);
  const weekly = installment(principal, monthlyRate, months, "weekly");

  return (
    <ProductDetail
      content={{
        icon: Banknote,
        eyebrow: "loans",
        title: "Micro-Loans",
        tagline: "Your savings record is your credit score. Borrow to grow your stall, shop or farm — individually, or as part of a group.",
        features: [
          { title: "Individual lending", description: "Two completed susu cycles or 3 months of savings unlocks a loan up to 2x your average monthly savings." },
          { title: "Group lending", description: "New to saving with us? Join a 5-person group with staggered, mutually-guaranteed disbursement." },
          { title: "Flat, transparent pricing", description: "4.5% flat interest per month plus a 2% processing fee — no surprises." },
          { title: "Repayment matched to your cash flow", description: "Daily, weekly or monthly installments, collected by the same agent who knows your route." },
        ],
        requirements: [
          "An active Grainy Palace savings or susu account in good standing",
          "Valid Ghana Card",
          "A guarantor who is also a client (individual loans) or group membership (group loans)",
        ],
        workedExample: {
          title: `${formatGHS(principal)} loan over ${months} months`,
          steps: [
            { label: "Principal", value: formatGHS(principal) },
            { label: "Flat interest rate", value: `${(monthlyRate * 100).toFixed(1)}% per month` },
            { label: "Processing fee (2%)", value: formatGHS(fee) },
            { label: "Total repayable", value: formatGHS(total) },
            { label: "Weekly installment", value: formatGHS(weekly) },
          ],
          note: "Total repayable = principal x (1 + flat rate x months), spread evenly across your chosen repayment frequency.",
        },
        rates,
        faqs,
      }}
    />
  );
}
