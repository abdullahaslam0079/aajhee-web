"use client";

import { useSyncExternalStore } from "react";
import { getSavedLocation, type GeoPoint } from "./location";

function subscribe(cb: () => void) {
  window.addEventListener("aajhee-location", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("aajhee-location", cb);
    window.removeEventListener("storage", cb);
  };
}

export function useLocation(): GeoPoint {
  return useSyncExternalStore(subscribe, getSavedLocation, getSavedLocation);
}
