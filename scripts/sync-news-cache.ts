/**
 * Local fallback: sync ANN news to Supabase from your machine.
 *
 * Usage: npx tsx scripts/sync-news-cache.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on existing env vars
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Make sure .env.local exists in:", process.cwd());
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const ANN_RSS_URL = "https://www.animenewsnetwork.com/news/rss.xml";

interface RssItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  category: string;
  pubDate: string;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] ?? "";
    const get = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m?.[1]?.trim() ?? "";
    };
    const guidMatch = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);

    items.push({
      guid: guidMatch?.[1]?.trim() ?? "",
      title: get("title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      description: get("description").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      link: get("link"),
      category: get("category"),
      pubDate: get("pubDate"),
    });
  }

  return items;
}

async function main() {
  console.log("Fetching ANN RSS...");
  const res = await fetch(ANN_RSS_URL, {
    headers: {
      "User-Agent": "AnimeChrono/1.0 (https://animechrono.com)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!res.ok) {
    throw new Error(`ANN RSS fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const items = parseRss(xml);
  console.log(`  Parsed ${items.length} items`);

  const animeItems = items.filter((i) => i.category === "Anime");
  console.log(`  ${animeItems.length} anime-category items`);

  // Load franchise titles + aliases
  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, aliases");

  const candidates: { franchiseId: string; candidate: string }[] = [];
  for (const f of franchises ?? []) {
    const allNames = [f.title, ...(f.aliases ?? [])];
    for (const name of allNames) {
      if (name.length >= 4) {
        candidates.push({ franchiseId: f.id, candidate: name.toLowerCase() });
      }
    }
  }
  candidates.sort((a, b) => b.candidate.length - a.candidate.length);

  // Match and build rows
  const now = new Date().toISOString();
  let matched = 0;

  const rows = animeItems
    .filter((item) => item.guid && item.title)
    .map((item) => {
      const headlineLower = item.title.toLowerCase();
      let franchiseId: string | null = null;

      for (const { franchiseId: fId, candidate } of candidates) {
        if (headlineLower.includes(candidate)) {
          franchiseId = fId;
          break;
        }
      }

      if (franchiseId) matched++;

      return {
        id: item.guid,
        title: item.title,
        description: item.description || null,
        source_url: item.link,
        category: item.category,
        published_at: new Date(item.pubDate).toISOString(),
        franchise_id: franchiseId,
        synced_at: now,
      };
    });

  console.log(`\nUpserting ${rows.length} news items (${matched} matched to franchises)...`);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("news_cache")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("Upsert error:", error);
      process.exit(1);
    }
  }

  // Prune old unmatched articles
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("news_cache")
    .delete()
    .is("franchise_id", null)
    .lt("published_at", thirtyDaysAgo);

  console.log("\nSync complete!");
  console.log(`  Total RSS items: ${items.length}`);
  console.log(`  Anime items: ${animeItems.length}`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Unmatched: ${rows.length - matched}`);
}

main().catch((err) => {
  console.error("News sync failed:", err);
  process.exit(1);
});
