import type { Metadata } from "next";

import { CtaBand } from "@/components/home/cta-band";
import { Hero } from "@/components/home/hero";
import { HowSusuWorks } from "@/components/home/how-susu-works";
import { NewsPreview } from "@/components/home/news-preview";
import { ProductCards } from "@/components/home/product-cards";
import { SavingsCalculator } from "@/components/home/savings-calculator";
import { TestimonialsGrid } from "@/components/home/testimonials-grid";
import { TrustStatsBar } from "@/components/home/trust-stats-bar";
import { Container } from "@/components/site/container";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { siteConfig } from "@/lib/site-config";
import { getFaqs, getPublishedPosts, getSiteStats, getTestimonials } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Save a little every day. Build something big.",
  description:
    "Daily susu, savings, fixed deposits and micro-loans for market traders, artisans and families. Licensed, trusted, and brought to your doorstep.",
};

export default async function HomePage() {
  const [stats, testimonials, faqs, posts] = await Promise.all([
    getSiteStats(),
    getTestimonials(),
    getFaqs(),
    getPublishedPosts(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FinancialService",
        name: siteConfig.name,
        description:
          "Community microfinance offering daily susu, savings, fixed deposits and micro-loans.",
        telephone: siteConfig.phoneDisplay,
        email: siteConfig.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.address,
          addressCountry: "GH",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <TrustStatsBar stats={stats} />
      <ProductCards />
      <HowSusuWorks />
      <SavingsCalculator />
      <TestimonialsGrid testimonials={testimonials} />
      <section className="bg-card py-20">
        <Container>
          <SectionHeading
            eyebrow="Questions, answered"
            title="Frequently asked questions"
            align="center"
          />
          <div className="mt-12">
            <FaqAccordion faqs={faqs} />
          </div>
        </Container>
      </section>
      <NewsPreview posts={posts} />
      <CtaBand />
    </>
  );
}
