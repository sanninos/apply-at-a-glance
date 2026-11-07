import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenInput = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(["android", "web", "ios"]).default("android"),
});

export const ensureUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (userError || !user.user) throw new Error("No pudimos cargar la cuenta.");

    const { data: usuario, error: readError } = await supabaseAdmin
      .from("Usuario")
      .select("id")
      .or(`auth_id.eq.${context.userId},user_id.eq.${context.userId}`)
      .limit(1)
      .maybeSingle();
    if (readError) throw new Error("No pudimos comprobar el perfil.");
    if (usuario) return { ok: true, created: false };

    const displayName = String(
      user.user.user_metadata?.["full_name"] ?? user.user.user_metadata?.["name"] ?? "",
    ).trim().slice(0, 100) || null;
    const { error } = await supabaseAdmin.from("Usuario").insert({
      auth_id: context.userId,
      user_id: context.userId,
      email: user.user.email ?? "",
      nombre: displayName,
      activo: true,
    });
    if (error) throw new Error("No pudimos crear el perfil de usuario.");
    return { ok: true, created: true };
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
    const { data: usuario, error: usuarioReadError } = await supabaseAdmin
      .from("Usuario")
      .select("id")
      .or(`auth_id.eq.${context.userId},user_id.eq.${context.userId}`)
      .limit(1)
      .maybeSingle();
    if (usuarioReadError) throw new Error("No pudimos comprobar el usuario.");

    if (!usuario) {
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      if (userError || !user.user) throw new Error("No pudimos cargar la cuenta.");
      const email = String(user.user.email ?? user.user.user_metadata?.["email"] ?? "").trim();
      if (!email) throw new Error("La cuenta no tiene un correo válido.");

      const { data: existing, error: existingError } = await supabaseAdmin
        .from("Usuario")
        .select("id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();
      if (existingError) throw new Error("No pudimos comprobar el perfil.");

      if (existing) {
        const { error: linkError } = await supabaseAdmin
          .from("Usuario")
          .update({ auth_id: context.userId, user_id: context.userId })
          .eq("id", existing.id);
        if (linkError) throw new Error("No pudimos vincular el perfil.");
      } else {
        const { error: insertError } = await supabaseAdmin.from("Usuario").insert({
          auth_id: context.userId,
          user_id: context.userId,
          email,
          nombre: String(user.user.user_metadata?.["full_name"] ?? user.user.user_metadata?.["name"] ?? "").trim() || null,
          activo: true,
        });
        if (insertError) throw new Error("No pudimos crear el perfil.");
      }
    }

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

    const { data: updatedUsuario, error: usuarioError } = await supabaseAdmin
      .from("Usuario")
      .update({
        fcm_token: data.token,
        fcm_updated_at: new Date().toISOString(),
      })
      .or(`auth_id.eq.${context.userId},user_id.eq.${context.userId}`)
      .select("id");
    if (usuarioError) throw new Error("No pudimos guardar el token en la cuenta.");
    if (!updatedUsuario?.length) throw new Error("No encontramos el perfil de usuario.");
    return { ok: true };
  });
