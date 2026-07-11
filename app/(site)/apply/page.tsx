import type { Metadata } from "next";

import { ApplyForm } from "@/components/apply/apply-form";
import { Container } from "@/components/site/container";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Open an Account",
  description: "Apply for a Grainy Palace savings account, daily susu, fixed deposit or micro-loan in a few minutes.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-2xl">
        <p className="eyebrow">Open an account</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
          Let&apos;s get you started
        </h1>
        <p className="mt-3 text-muted-foreground">
          It takes about two minutes. A member of our team will follow up to complete your
          registration in person.
        </p>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <ApplyForm defaultProduct={product} />
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
