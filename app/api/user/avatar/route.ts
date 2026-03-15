import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "avatars";

/** Ensure the avatars bucket exists (idempotent) */
async function ensureBucket(serviceClient: ReturnType<typeof createServiceClient>) {
  const { data: buckets } = await serviceClient.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await serviceClient.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  }
}

/** POST /api/user/avatar — upload avatar image */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File must be JPEG, PNG, or WebP" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be under 2MB" },
      { status: 400 },
    );
  }

  // Use service client for storage operations (bypasses RLS)
  const serviceClient = createServiceClient();
  await ensureBucket(serviceClient);

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  // Get current avatar to delete after upload
  const { data: currentUser } = await serviceClient
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  // Read file into buffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload new avatar
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 },
    );
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = serviceClient.storage.from(BUCKET).getPublicUrl(filePath);

  // Update user record
  const { error: updateError } = await serviceClient
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }

  // Delete old avatar file if it exists and is in our bucket
  if (currentUser?.avatar_url && currentUser.avatar_url.includes(`/${BUCKET}/`)) {
    try {
      const oldPath = currentUser.avatar_url.split(`/${BUCKET}/`).pop();
      if (oldPath && oldPath !== filePath) {
        await serviceClient.storage.from(BUCKET).remove([oldPath]);
      }
    } catch {
      // Non-critical
    }
  }

  return NextResponse.json({ avatar_url: publicUrl });
}
