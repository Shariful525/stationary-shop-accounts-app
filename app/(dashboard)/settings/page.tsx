import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const user = await requireAuth();

  return <SettingsView user={user} />;
}
