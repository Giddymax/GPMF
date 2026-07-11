import type { Metadata } from "next";
import { HeartHandshake, ShieldCheck, Target, Users } from "lucide-react";

import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getTeamMembers } from "@/lib/data/public";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Grainy Palace Financial Service brings safe, convenient savings and credit to market traders, artisans and families in a small Ghanaian town.",
};

const values = [
  { icon: ShieldCheck, title: "Trust", description: "Every cedi is receipted and ledgered the moment it is collected." },
  { icon: HeartHandshake, title: "Community", description: "We hire from, train in, and answer to the town we serve." },
  { icon: Target, title: "Discipline", description: "Conservative lending and a strict liquidity reserve keep your money safe." },
  { icon: Users, title: "Accessibility", description: "No queues, no intimidating banking halls — we come to you." },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export default async function AboutPage() {
  const team = await getTeamMembers();

  return (
    <>
      <section className="bg-gradient-navy py-20 text-white">
        <Container>
          <p className="eyebrow text-gold-200/90">About us</p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
            Banking that shows up where you are
          </h1>
          <p className="mt-5 max-w-2xl text-white/80">
            Grainy Palace Financial Service was founded to bring safe, convenient and affordable
            financial services to market traders, artisans, farmers, small shop owners and
            salaried workers who are underserved by commercial banks.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Our story" title="Started with a community durbar" />
            <p className="mt-5 text-muted-foreground">
              We opened our doors with a community durbar — inviting the chief, the assembly
              member, the market queen, and local pastors and imams — because trust is the
              product we sell. We started with daily susu and micro-savings, the same way susu
              collectors have worked in Ghanaian markets for generations, but backed by an
              instant-receipt mobile system and a real double-entry ledger behind every cedi.
            </p>
            <p className="mt-4 text-muted-foreground">
              As our clients built a savings history with us, we introduced micro-loans — because
              a clean savings record is the best credit score a market trader can have. Fixed
              deposits followed as we grew our capital base.
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="Where we're going" title="Mission and vision" />
            <div className="mt-5 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-gold-700 dark:text-gold-500">Mission</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    To bring safe, convenient and affordable savings, susu, fixed deposit and
                    micro-loan services to underserved communities, one daily visit at a time.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-gold-700 dark:text-gold-500">Vision</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    To be the most trusted financial partner in every small town we serve —
                    growing from a Last-Mile Provider into a fully licensed community bank owned in
                    part by the communities we serve.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-card py-20">
        <Container>
          <SectionHeading eyebrow="What guides us" title="Our values" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-gradient-gold text-navy-900">
                  <v.icon className="size-5" />
                </div>
                <h3 className="font-heading font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Leadership" title="The team behind Grainy Palace" align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card key={member.id} className="text-center">
                <CardContent className="pt-6">
                  <Avatar className="mx-auto size-16">
                    <AvatarFallback className="text-base">{initials(member.full_name)}</AvatarFallback>
                  </Avatar>
                  <h3 className="mt-3 font-heading font-semibold">{member.full_name}</h3>
                  <p className="text-xs font-medium text-gold-700 dark:text-gold-500">{member.role_title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-card py-16">
        <Container className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow="Regulatory standing" title="Licensed and supervised" />
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.regulatoryNote}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Our operational policies — credit, savings and susu, liquidity, and AML/CFT — are
              approved by our board and available on request. Interest rates and fees are always
              published openly in our banking hall.
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="Giving back" title="Community &amp; CSR" />
            <p className="mt-4 text-sm text-muted-foreground">
              We sponsor market association events, support school savings clubs to build financial
              literacy early, and prioritise hiring and training field agents from within the
              communities we serve.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
