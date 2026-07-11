import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";

import { ProductDetail } from "@/components/products/product-detail";
import { getFaqs, getRates } from "@/lib/data/public";
import { monthlyInterest } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Savings Accounts",
  description: "Open a Grainy Palace savings account with as little as GHS 20 and earn interest on your average daily balance.",
};

export default async function SavingsPage() {
  const [rates, faqs] = await Promise.all([getRates("savings"), getFaqs("withdrawals")]);
  const rate = rates[0]?.rate ?? 0.05;
  const exampleBalance = 500;
  const interest = monthlyInterest(exampleBalance, rate);

  return (
    <ProductDetail
      content={{
        icon: PiggyBank,
        eyebrow: "savings",
        title: "Savings Accounts",
        tagline: "A safe, flexible place to keep your money and watch it grow — open with as little as GHS 20.",
        features: [
          { title: "Low opening balance", description: "Start an account with as little as GHS 20 — no hidden minimums." },
          { title: "Interest on your balance", description: "Earn interest on your average daily balance, posted monthly." },
          { title: "Withdraw anytime", description: "Access your money whenever you need it, subject to a small withdrawal fee." },
          { title: "Builds your credit record", description: "A steady savings history is exactly what we look at when you apply for a loan." },
          { title: "Agent or branch service", description: "Deposit with our field agents or visit the banking hall." },
          { title: "Instant receipts", description: "Every deposit and withdrawal is receipted and recorded immediately." },
        ],
        requirements: [
          "Valid Ghana Card",
          "One passport-sized photograph",
          "Minimum opening deposit of GHS 20",
          "A phone number we can reach you on",
        ],
        workedExample: {
          title: `Interest on a ${formatGHS(exampleBalance)} average balance`,
          steps: [
            { label: "Average daily balance", value: formatGHS(exampleBalance) },
            { label: "Annual interest rate", value: `${(rate * 100).toFixed(1)}%` },
            { label: "Interest posted this month", value: formatGHS(interest) },
          ],
          note: "Interest = average daily balance x annual rate / 12, posted to your account at month end.",
        },
        rates,
        faqs,
      }}
    />
  );
}
