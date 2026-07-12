import { createClient } from "@/lib/supabase/server";
import type { Faq, HeroSlide, Post, Rate, SiteStat, TeamMember, Testimonial } from "@/lib/supabase/types";
import {
  fallbackFaqs,
  fallbackHeroSlides,
  fallbackPosts,
  fallbackRates,
  fallbackSiteStats,
  fallbackTeamMembers,
  fallbackTestimonials,
} from "./fallback";

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("your-project-ref"));
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await query();
  } catch {
    return fallback;
  }
}

export async function getPublishedPosts(): Promise<Post[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Post[];
  }, fallbackPosts);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    return data as Post | null;
  }, fallbackPosts.find((p) => p.slug === slug) ?? null);
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("published", true)
      .order("sort_order");
    if (error) throw error;
    return data as HeroSlide[];
  }, fallbackHeroSlides);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("published", true)
      .order("sort_order");
    if (error) throw error;
    return data as Testimonial[];
  }, fallbackTestimonials);
}

export async function getFaqs(category?: string): Promise<Faq[]> {
  const all = await safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("published", true)
      .order("sort_order");
    if (error) throw error;
    return data as Faq[];
  }, fallbackFaqs);
  return category ? all.filter((f) => f.category === category) : all;
}

export async function getRates(product?: string): Promise<Rate[]> {
  const all = await safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rates")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return data as Rate[];
  }, fallbackRates);
  return product ? all.filter((r) => r.product === product) : all;
}

export async function getSiteStats(): Promise<SiteStat[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_stats").select("*").order("sort_order");
    if (error) throw error;
    return data as SiteStat[];
  }, fallbackSiteStats);
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("published", true)
      .order("sort_order");
    if (error) throw error;
    return data as TeamMember[];
  }, fallbackTeamMembers);
}
