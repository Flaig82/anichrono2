import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-side operations that bypass RLS.
 * Use only in API routes for trusted operations like applying proposals.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
