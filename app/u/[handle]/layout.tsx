import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("user")
    .select("display_name, handle, avatar_url, era, total_aura")
    .eq("handle", params.handle)
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
      images: profile.avatar_url
        ? [{ url: profile.avatar_url, alt: profile.display_name }]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
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
