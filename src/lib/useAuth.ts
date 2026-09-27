"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getRole, getUser, isLoggedIn } from "@/lib/auth";
import type { Role } from "@/lib/auth";
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const loggedIn = useSyncExternalStore(subscribe, isLoggedIn, () => false);
  const role = useSyncExternalStore(subscribe, getRole, () => null as Role | null);
  const user = useSyncExternalStore(
    subscribe,
    () => getUser<User>(),
    () => null as User | null,
  );

  return {
    /** False until client has read localStorage — do not redirect while !ready. */
    ready,
    loggedIn: ready ? loggedIn : false,
    role: ready ? role : null,
    user: ready ? user : null,
  };
}
