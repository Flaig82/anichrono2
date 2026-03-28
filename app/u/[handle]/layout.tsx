import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user")
    .select("display_name, handle, avatar_url, era, total_aura")
    .eq("handle", handle)
    .single();

  if (!profile) {
    return { title: "User Not Found" };
  }

  const title = `${profile.display_name} (@${profile.handle})`;
  const description = `${profile.display_name}'s anime journey on AnimeChrono — ${profile.era ?? "Initiate"} era with ${profile.total_aura ?? 0} total Aura.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://animechrono.com/u/${profile.handle}`,
      images: [{ url: "/images/og.png", width: 1200, height: 630, alt: profile.display_name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og.png"],
    },
    alternates: {
      canonical: `https://animechrono.com/u/${profile.handle}`,
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
