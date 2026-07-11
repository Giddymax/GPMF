"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gpfs-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies to keep you signed in and understand how our site is used. See our{" "}
          <Link href="/privacy" className="font-medium text-gold-700 underline dark:text-gold-500">
            Privacy Policy
          </Link>
          .
        </p>
        <Button onClick={accept} size="sm">
          Got it
        </Button>
      </div>
    </div>
  );
}
