import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing your use of Grainy Palace Financial Service products.",
};

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-2xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/90 sm:prose-base">
          <section>
            <h2 className="font-heading text-lg font-semibold">1. Eligibility</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our products are available to individuals 18 years or older who provide a valid Ghana
              Card and complete our know-your-customer process.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">2. Susu contributions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Daily susu is collected over a 31-day cycle at the daily amount you select. One day&apos;s
              contribution is retained as our collection fee at the end of each completed cycle;
              cycles with fewer than 15 days paid earn a reduced (half) fee. Payouts are made at
              cycle end unless you instruct us to roll over into the next cycle.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">3. Savings &amp; withdrawals</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Savings accounts earn interest on the average daily balance, posted monthly.
              Withdrawals may attract a fee, published in our banking hall and on our Products
              pages.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">4. Fixed deposits</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fixed deposits earn simple interest at the contracted rate for the full term. Early
              termination is recalculated at the prevailing savings rate for the days actually held,
              and will never exceed the value the deposit would have earned at full maturity.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">5. Loans</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Loans are priced at a flat monthly rate plus a processing fee, disbursed only to
              clients meeting our eligibility criteria, and repaid on the agreed schedule. Late
              payments attract a penalty capped at 10% of the installment amount. Group loans carry
              joint liability among group members as described in your loan agreement.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">6. Changes to these terms</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We may update these terms from time to time. Material changes will be communicated
              through our agents or posted in our banking hall.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">7. Governing law</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These terms are governed by the laws of the Republic of Ghana and Bank of Ghana
              regulations applicable to Last-Mile Providers.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold">8. Contact us</h2>
            <p className="mt-2 text-sm text-muted-foreground">{siteConfig.address} · {siteConfig.phoneDisplay}</p>
          </section>
        </div>
      </Container>
    </section>
  );
}
