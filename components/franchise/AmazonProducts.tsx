"use client";

import { ShoppingBag, ExternalLink } from "lucide-react";
import { trackAmazonClick } from "@/lib/utils";

const AMAZON_TAG = "animechrono-20";

interface ProductLink {
  label: string;
  query: string;
}

function buildProductLinks(franchiseTitle: string): ProductLink[] {
  const title = franchiseTitle.replace(/\s*\(.*?\)\s*/g, "").trim();
  return [
    { label: "Manga", query: `${title} manga` },
    { label: "Blu-ray", query: `${title} anime blu-ray` },
    { label: "Figures", query: `${title} anime figure` },
  ];
}

function buildAmazonUrl(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

export default function AmazonProducts({
  franchiseTitle,
}: {
  franchiseTitle: string;
}) {
  const products = buildProductLinks(franchiseTitle);

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2 px-2">
        <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Shop
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {products.map((product) => (
          <a
            key={product.label}
            href={buildAmazonUrl(product.query)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAmazonClick(`${franchiseTitle} - ${product.label}`)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
          >
            <ShoppingBag size={14} className="shrink-0 text-aura-muted" />
            <div className="min-w-0 flex-1">
              <p className="font-body text-[12px] font-bold text-white">
                {franchiseTitle} {product.label}
              </p>
            </div>
            <ExternalLink size={11} className="shrink-0 text-aura-muted/50" />
          </a>
        ))}
      </div>
    </div>
  );
}
