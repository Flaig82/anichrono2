import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-side operations that bypass RLS.
 * Singleton — the service client has no per-request state (no cookies),
 * so one instance is reused across all requests to reduce connection pressure.
 */
let serviceClient: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return serviceClient;
}
