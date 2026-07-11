import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function CtaBand() {
  return (
    <section className="bg-gradient-navy py-16 text-white">
      <Container className="flex flex-col items-center gap-6 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
          Ready to start saving the safe way?
        </h2>
        <p className="max-w-xl text-white/75">
          Open an account in minutes with your Ghana Card. Our agents are already in your
          neighbourhood.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/apply">Open an Account</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
            <a href={siteConfig.phoneHref}>Call {siteConfig.phoneDisplay}</a>
          </Button>
        </div>
      </Container>
    </section>
  );
}
