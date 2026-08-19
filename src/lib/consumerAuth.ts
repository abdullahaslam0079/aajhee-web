import { api } from "./api";
import { setSession } from "./auth";
import type { AuthPayload } from "./types";

export async function completeFirebaseLogin(idToken: string, displayName?: string) {
  const data = await api<AuthPayload>("/api/auth/firebase", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
  let user = data.user || { id: 0, email: "" };
  setSession({
    access: data.access,
    refresh: data.refresh,
    user,
    role: "consumer",
  });

  const name = displayName?.trim();
  if (name && name !== user.name) {
    try {
      const updated = await api<{ name?: string }>("/api/user/profile", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ name }),
      });
      user = { ...user, ...updated, name };
      setSession({
        access: data.access,
        refresh: data.refresh,
        user,
        role: "consumer",
      });
    } catch {
      /* keep the Firebase session even if the name update fails */
    }
  }
  return data;
}
