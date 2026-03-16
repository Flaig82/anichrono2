import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/shared/CookieConsent";
import AuthInitializer from "@/components/layout/AuthInitializer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://animechrono.com"),
  title: {
    default: "AnimeChrono — Your anime journey, measured.",
    template: "%s — AnimeChrono",
  },
  description:
    "Track what you've watched, build your Aura, and follow community-curated watch orders for every anime franchise.",
  applicationName: "AnimeChrono",
  keywords: [
    "anime",
    "watch order",
    "anime guide",
    "anime tracker",
    "anime community",
    "anime franchise",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://animechrono.com",
    siteName: "AnimeChrono",
    title: "AnimeChrono — Your anime journey, measured.",
    description:
      "Track what you've watched, build your Aura, and follow community-curated watch orders for every anime franchise.",
    images: [
      {
        url: "/images/og.png",
        width: 1200,
        height: 630,
        alt: "AnimeChrono",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimeChrono — Your anime journey, measured.",
    description:
      "Track what you've watched, build your Aura, and follow community-curated watch orders for every anime franchise.",
    images: ["/images/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://s4.anilist.co" />
        <link rel="preconnect" href="https://pvxynfkwjdhpbptrxarp.supabase.co" />
        <link rel="preconnect" href="https://cdn.discordapp.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AnimeChrono",
              url: "https://animechrono.com",
              description:
                "Community-curated anime watch orders and reputation system.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://animechrono.com/discover?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AnimeChrono",
              url: "https://animechrono.com",
              logo: "https://animechrono.com/favicon.ico",
              description:
                "Community-curated anime watch orders and reputation system.",
            }),
          }}
        />
      </head>
      <body
        className={`${montserrat.variable} ${lato.variable} font-body antialiased`}
      >
        <AuthInitializer />
        <TooltipProvider delayDuration={300}>
          <Nav />
          {children}
          <Footer />
          <CookieConsent />
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
