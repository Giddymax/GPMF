import type { Metadata } from "next";
import Link from "next/link";
import { Calendar } from "lucide-react";

import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedPosts } from "@/lib/data/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "News",
  description: "Updates, milestones and community stories from Grainy Palace Financial Service.",
};

export default async function NewsPage() {
  const posts = await getPublishedPosts();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="News" title="What's happening at Grainy Palace" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-GH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </div>
                  <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{post.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {posts.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">No news posted yet — check back soon.</p>
        ) : null}
      </Container>
    </section>
  );
}
