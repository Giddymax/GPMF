import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Visit, call or message Grainy Palace Financial Service — including how to file a complaint.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-gradient-navy py-20 text-white">
        <Container>
          <p className="eyebrow text-gold-200/90">Contact</p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
            We&apos;re easy to reach
          </h1>
          <p className="mt-4 max-w-xl text-white/80">
            Visit our office, call, WhatsApp, or send us a message below.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-gold-700 dark:text-gold-500" />
                  <div>
                    <p className="text-sm font-semibold">Office</p>
                    <p className="text-sm text-muted-foreground">{siteConfig.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-5 shrink-0 text-gold-700 dark:text-gold-500" />
                  <div>
                    <p className="text-sm font-semibold">Phone</p>
                    <a href={siteConfig.phoneHref} className="text-sm text-muted-foreground hover:text-foreground">
                      {siteConfig.phoneDisplay}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MessageCircle className="mt-0.5 size-5 shrink-0 text-gold-700 dark:text-gold-500" />
                  <div>
                    <p className="text-sm font-semibold">WhatsApp</p>
                    <a href={siteConfig.whatsappHref} className="text-sm text-muted-foreground hover:text-foreground">
                      Message us on WhatsApp
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-gold-700 dark:text-gold-500" />
                  <div>
                    <p className="text-sm font-semibold">Email</p>
                    <a href={`mailto:${siteConfig.email}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {siteConfig.email}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-gold-700 dark:text-gold-500" />
                  <div>
                    <p className="text-sm font-semibold">Hours</p>
                    <ul className="text-sm text-muted-foreground">
                      {siteConfig.hours.map((h) => (
                        <li key={h.days}>{h.days}: {h.time}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-48 rounded-xl border border-dashed border-border bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">
              Map placeholder — {siteConfig.address}
            </div>
          </div>

          <div id="complaint">
            <SectionHeading
              eyebrow="Send a message"
              title="General inquiries &amp; complaints"
              description="Use this form for questions, feedback, or to file a formal complaint. Complaints are reviewed by management within 2 business days."
            />
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
