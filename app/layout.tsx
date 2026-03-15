import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import Nav from "@/components/layout/Nav";
import AuthInitializer from "@/components/layout/AuthInitializer";
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
  title: "AnimeChrono — Your anime journey, measured.",
  description:
    "Track what you've watched, build your Aura, and follow community-curated watch orders for every franchise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${montserrat.variable} ${lato.variable} font-body antialiased`}
      >
        <AuthInitializer />
        <Nav />
        {children}
      </body>
    </html>
  );
}
