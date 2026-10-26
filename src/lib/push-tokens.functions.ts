import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenInput = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(["android", "web", "ios"]).default("android"),
});

// Public: called on first app open, before any sign-in. Never detaches or reassigns an owner.
export const registerPushToken = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await supabaseAdmin
      .from("push_tokens")
      .select("id")
      .eq("token", data.token)
      .maybeSingle();
    if (readError) throw new Error("No pudimos registrar el dispositivo.");
    if (existing) {
      await supabaseAdmin
        .from("push_tokens")
        .update({ last_seen_at: new Date().toISOString(), platform: data.platform })
        .eq("id", existing.id);
    } else {
      const { error } = await supabaseAdmin
        .from("push_tokens")
        .insert({ token: data.token, platform: data.platform });
      if (error && error.code !== "23505") throw new Error("No pudimos registrar el dispositivo.");
    }
    return { ok: true };
  });

// Authenticated: links this device token to the signed-in account.
export const linkPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => tokenInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_tokens").upsert(
      {
        token: data.token,
        platform: data.platform,
        user_id: context.userId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (error) throw new Error("No pudimos vincular el dispositivo.");
    return { ok: true };
  });
