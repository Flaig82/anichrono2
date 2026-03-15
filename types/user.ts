import type { Era, AuraType } from "./aura";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  auth_provider: "email" | "google" | "discord";
  era: Era;
  dominant_aura_type: AuraType | null;
  total_aura: number;
  anilist_username: string | null;
  mal_username: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
