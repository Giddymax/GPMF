import type { Metadata } from "next";

import { ConnectSupabaseNotice } from "@/components/admin/connect-supabase-notice";
import { GenericContentTable } from "@/components/admin/content/generic-content-table";
import { ProductConfigEditor } from "@/components/admin/content/product-config-editor";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONTENT_FIELDS, CONTENT_LABELS, CONTENT_TABLES } from "@/lib/admin-content-config";
import {
  getAllFaqs,
  getAllHeroSlides,
  getAllPosts,
  getAllRates,
  getAllSiteStats,
  getAllTeamMembers,
  getAllTestimonials,
  getProductConfig,
} from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: "Content & Settings" };

export default async function ContentPage() {
  const [heroSlides, posts, testimonials, faqs, rates, siteStats, teamMembers, productConfig] = await Promise.all([
    getAllHeroSlides(),
    getAllPosts(),
    getAllTestimonials(),
    getAllFaqs(),
    getAllRates(),
    getAllSiteStats(),
    getAllTeamMembers(),
    getProductConfig(),
  ]);

  const rowsByTable = {
    hero_slides: heroSlides,
    posts,
    testimonials,
    faqs,
    rates,
    site_stats: siteStats,
    team_members: teamMembers,
  } as const;

  return (
    <div>
      {!isSupabaseConfigured() ? <ConnectSupabaseNotice /> : null}

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-white">Content &amp; Settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Everything shown on the public site, plus product rates, fees and guardrail thresholds —
          changes here never require a deploy.
        </p>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="flex-wrap">
          {CONTENT_TABLES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {CONTENT_LABELS[t].title}
            </TabsTrigger>
          ))}
          <TabsTrigger value="config">Product config</TabsTrigger>
        </TabsList>

        {CONTENT_TABLES.map((t) => (
          <TabsContent key={t} value={t}>
            <Card className="mt-4 border-white/10 bg-navy-800 p-4">
              <GenericContentTable
                table={t}
                title={CONTENT_LABELS[t].title}
                fields={CONTENT_FIELDS[t]}
                primaryField={CONTENT_LABELS[t].primaryField}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                rows={rowsByTable[t] as any}
              />
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="config">
          <div className="mt-4">
            <ProductConfigEditor configs={productConfig} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
