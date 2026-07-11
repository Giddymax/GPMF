import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { FacebookIcon, InstagramIcon, XIcon } from "@/components/icons/social";
import { Container } from "@/components/site/container";
import { productLinks, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="bg-gradient-navy text-white/90">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/brand/icon-192.png" alt="" width={36} height={36} className="h-9 w-9" />
              <span className="font-heading text-lg font-semibold text-white">GRAINY PALACE</span>
            </div>
            <p className="mt-4 text-sm text-white/70">{siteConfig.tagline}</p>
            <div className="mt-5 flex gap-3">
              <a href={siteConfig.socials.facebook} aria-label="Facebook" className="text-white/70 hover:text-gold-500">
                <FacebookIcon />
              </a>
              <a href={siteConfig.socials.instagram} aria-label="Instagram" className="text-white/70 hover:text-gold-500">
                <InstagramIcon />
              </a>
              <a href={siteConfig.socials.x} aria-label="X (Twitter)" className="text-white/70 hover:text-gold-500">
                <XIcon />
              </a>
            </div>
          </div>

          <div>
            <h3 className="eyebrow text-white/60">Products</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {productLinks.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="text-white/80 hover:text-gold-500">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-white/60">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" className="text-white/80 hover:text-gold-500">About us</Link></li>
              <li><Link href="/news" className="text-white/80 hover:text-gold-500">News</Link></li>
              <li><Link href="/apply" className="text-white/80 hover:text-gold-500">Open an account</Link></li>
              <li><Link href="/contact" className="text-white/80 hover:text-gold-500">Contact</Link></li>
              <li><Link href="/contact#complaint" className="text-white/80 hover:text-gold-500">File a complaint</Link></li>
              <li><Link href="/admin/login" className="text-white/50 hover:text-gold-500">Staff login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-white/60">Visit or call us</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-500" />
                <span>{siteConfig.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold-500" />
                <a href={siteConfig.phoneHref} className="hover:text-gold-500">{siteConfig.phoneDisplay}</a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold-500" />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-gold-500">{siteConfig.email}</a>
              </li>
            </ul>
            <ul className="mt-4 space-y-1 text-xs text-white/60">
              {siteConfig.hours.map((h) => (
                <li key={h.days}>{h.days}: {h.time}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rule-gold my-8 opacity-60" />

        <div className="flex flex-col gap-3 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{siteConfig.regulatoryNote}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold-500">Privacy</Link>
            <Link href="/terms" className="hover:text-gold-500">Terms</Link>
            <span>&copy; {new Date().getFullYear()} {siteConfig.name}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
