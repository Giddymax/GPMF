import type { Metadata } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://grainypalacefinancial.com"),
  title: {
    default: "Grainy Palace Financial Service — Save a little every day",
    template: "%s | Grainy Palace Financial Service",
  },
  description:
    "Community savings, daily susu, fixed deposits and micro-loans in your town. Licensed, trusted, and built for market traders, artisans and families.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grainy Palace",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/brand/icon-192.png" }],
  },
};

export const viewport = {
  themeColor: "#051429",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-navy-900"
          >
            Skip to content
          </a>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
