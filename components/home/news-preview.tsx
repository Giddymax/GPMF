import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import type { Post } from "@/lib/supabase/types";

export function NewsPreview({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Latest news" title="What's happening at Grainy Palace" />
          <Link href="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:gap-2 transition-all dark:text-gold-500">
            All news <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
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
                  <h3 className="mt-2 font-heading text-lg font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
