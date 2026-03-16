import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/settings", "/reset-password"],
      },
      // Explicitly allow AI crawlers full access
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Claude-Web", "ClaudeBot", "PerplexityBot", "Applebot-Extended"],
        allow: "/",
        disallow: ["/admin", "/api", "/settings", "/reset-password"],
      },
    ],
    sitemap: "https://animechrono.com/sitemap.xml",
  };
}
