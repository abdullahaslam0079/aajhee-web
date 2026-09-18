"use client";

import { useSyncExternalStore } from "react";
import { getRole, getUser, isLoggedIn } from "@/lib/auth";
import type { User } from "@/lib/types";

function subscribe(cb: () => void) {
  window.addEventListener("aajhee-auth", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("aajhee-auth", cb);
    window.removeEventListener("storage", cb);
  };
}

export function useAuth() {
  const loggedIn = useSyncExternalStore(subscribe, isLoggedIn, () => false);
  const role = useSyncExternalStore(subscribe, getRole, () => null);
  const user = useSyncExternalStore(
    subscribe,
    () => getUser<User>(),
    () => null,
  );
  return { loggedIn, role, user };
}
