import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Application received",
  robots: { index: false },
};

export default async function ApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <section className="py-20">
      <Container className="max-w-lg text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-10 pb-8">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="size-7" />
            </div>
            <h1 className="font-heading text-2xl font-semibold">Application received</h1>
            <p className="text-sm text-muted-foreground">
              Thank you. A member of our team will contact you within one business day to complete
              your registration. Please keep your reference number handy.
            </p>
            {ref ? (
              <div className="rounded-lg bg-muted px-6 py-3">
                <p className="text-xs text-muted-foreground">Reference number</p>
                <p className="font-heading text-xl font-semibold">{ref}</p>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Questions? Call us on {siteConfig.phoneDisplay}.
            </p>
            <Button asChild className="mt-2">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
