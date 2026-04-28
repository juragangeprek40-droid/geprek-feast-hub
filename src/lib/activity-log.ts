import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
  | "role_changed"
  | "menu_created"
  | "menu_updated"
  | "menu_deleted"
  | "menu_availability_toggled"
  | "settings_updated";

interface LogParams {
  action: ActivityAction;
  entity_type: "user" | "menu" | "site_settings";
  entity_id?: string | null;
  entity_label?: string | null;
  details?: Record<string, unknown>;
}

export async function logActivity(params: LogParams) {
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return;

  let actorName: string | null = u.email ?? null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", u.id)
    .maybeSingle();
  if (prof?.full_name) actorName = prof.full_name;

  await (supabase.from("activity_logs") as any).insert({
    actor_id: u.id,
    actor_name: actorName,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    entity_label: params.entity_label ?? null,
    details: params.details ?? null,
  });
}
