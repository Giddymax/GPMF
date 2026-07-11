import type { Metadata } from "next";

import { SusuTinIcon } from "@/components/icons/susu-tin";
import { ProductDetail } from "@/components/products/product-detail";
import { getFaqs, getRates } from "@/lib/data/public";
import { cyclePayout, cycleCommission } from "@/lib/finance";
import { formatGHS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Daily Susu",
  description: "A Grainy Palace agent visits you every day to collect your susu contribution — get your lump sum back after 31 days.",
};

export default async function DailySusuPage() {
  const [rates, faqs] = await Promise.all([getRates("daily-susu"), getFaqs("safety")]);
  const daily = 10;
  const payout = cyclePayout(daily, 31);
  const commission = cycleCommission(daily, 31);

  return (
    <ProductDetail
      content={{
        icon: SusuTinIcon,
        eyebrow: "daily-susu",
        title: "Daily Susu",
        tagline: "The traditional way to save, made safer: a mobile banker collects your contribution every day for 31 days.",
        features: [
          { title: "Any amount, GHS 1–200", description: "Choose a daily amount that fits your trade and stick with it." },
          { title: "Doorstep collection", description: "Our agent comes to your stall or shop — you never have to close up to save." },
          { title: "One simple fee", description: "We keep one day's contribution as our fee — nothing more, nothing hidden." },
          { title: "Instant receipts", description: "Every single collection is receipted on the spot." },
          { title: "Rollover or withdraw", description: "At the end of each 31-day cycle, take your lump sum or roll straight into the next." },
          { title: "Builds loan eligibility", description: "Two completed cycles and you can apply for a micro-loan." },
        ],
        requirements: [
          "Valid Ghana Card",
          "One passport-sized photograph",
          "A regular stall, shop or home address on our agent's route",
        ],
        workedExample: {
          title: `Saving ${formatGHS(daily)} a day for one 31-day cycle`,
          steps: [
            { label: "Daily contribution", value: formatGHS(daily) },
            { label: "Days in a cycle", value: "31" },
            { label: "Collection fee (1 day)", value: formatGHS(commission) },
            { label: "You receive at payout", value: formatGHS(payout) },
          ],
          note: "Paying fewer than 15 days in a cycle halves the fee (there's less for us to collect and record) but also means a smaller payout.",
        },
        rates,
        faqs,
      }}
    />
  );
}
