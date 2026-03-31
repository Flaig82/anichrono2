import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

const ANN_RSS_URL = "https://www.animenewsnetwork.com/news/rss.xml";

interface RssItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  category: string;
  pubDate: string;
}

/** Parse ANN RSS XML using regex — no external parser needed. */
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

    // guid uses isPermaLink attribute
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

/** Match a headline to a franchise using case-insensitive substring matching. */
function matchHeadline(
  headlineLower: string,
  sortedCandidates: { franchiseId: string; candidate: string }[],
): string | null {
  for (const { franchiseId, candidate } of sortedCandidates) {
    if (headlineLower.includes(candidate)) {
      return franchiseId;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // --- Fetch RSS ---
  let xml: string;
  try {
    const res = await fetch(ANN_RSS_URL, {
      headers: {
        "User-Agent": "AnimeChrono/1.0 (https://animechrono.com)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`ANN RSS fetch failed: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: "ANN RSS fetch failed", status: res.status },
        { status: 502 },
      );
    }

    xml = await res.text();
  } catch (err) {
    console.error("ANN RSS fetch error:", err);
    return NextResponse.json(
      { error: "ANN RSS fetch error", details: String(err) },
      { status: 502 },
    );
  }

  // --- Parse RSS ---
  let items: RssItem[];
  try {
    items = parseRss(xml);
  } catch (err) {
    console.error("ANN RSS parse error:", err);
    return NextResponse.json(
      { error: "RSS parse failed", details: String(err) },
      { status: 502 },
    );
  }

  if (items.length === 0) {
    console.warn("ANN RSS returned 0 items — keeping stale cache");
    return NextResponse.json({ error: "RSS returned 0 items" }, { status: 502 });
  }

  // Filter to Anime category only
  const animeItems = items.filter((item) => item.category === "Anime");

  // --- Load franchise titles + aliases for matching ---
  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, aliases");

  // Build sorted match candidates (longest first to avoid partial matches)
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

  // --- Match and build rows ---
  const now = new Date().toISOString();
  let matched = 0;

  const rows = animeItems
    .filter((item) => item.guid && item.title)
    .map((item) => {
      const headlineLower = item.title.toLowerCase();
      const franchiseId = matchHeadline(headlineLower, candidates);
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

  // --- Upsert ---
  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("news_cache")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) {
      console.error("News cache upsert error:", upsertError);
      return NextResponse.json(
        { error: "Upsert failed", details: upsertError.message },
        { status: 500 },
      );
    }
  }

  // --- Prune old unmatched articles (30 days) ---
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("news_cache")
    .delete()
    .is("franchise_id", null)
    .lt("published_at", thirtyDaysAgo);

  // Prune matched articles older than 90 days (but keep 5 most recent per franchise)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("news_cache")
    .delete()
    .not("franchise_id", "is", null)
    .lt("published_at", ninetyDaysAgo);

  const result = {
    total: items.length,
    anime: animeItems.length,
    upserted: rows.length,
    matched,
    unmatched: rows.length - matched,
  };

  console.log("News sync complete:", result);
  return NextResponse.json(result);
}
