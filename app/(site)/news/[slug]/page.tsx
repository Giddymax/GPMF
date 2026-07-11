import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";

import { Container } from "@/components/site/container";
import { getPostBySlug } from "@/lib/data/public";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="py-16 sm:py-20">
      <Container className="max-w-2xl">
        <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All news
        </Link>
        <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })
            : ""}
          {post.author ? <span>· {post.author}</span> : null}
        </div>
        <h1 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">{post.title}</h1>
        <div className="rule-gold mt-6 w-16" />
        <div className="prose prose-sm mt-8 max-w-none text-foreground sm:prose-base">
          {post.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-4 leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ))}
        </div>
      </Container>
    </article>
  );
}
