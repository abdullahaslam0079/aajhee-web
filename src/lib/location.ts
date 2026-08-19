export const DEFAULT_LAT = Number(process.env.NEXT_PUBLIC_DEFAULT_LAT || 52.52);
export const DEFAULT_LNG = Number(process.env.NEXT_PUBLIC_DEFAULT_LNG || 13.405);

const KEY = "goluto.location";
const FALLBACK: GeoPoint = {
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LNG,
  label: "Berlin",
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

let cached: GeoPoint = FALLBACK;

export function getSavedLocation(): GeoPoint {
  if (typeof window === "undefined") return FALLBACK;
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as GeoPoint;
      if (parsed.latitude && parsed.longitude) {
        if (
          cached.latitude === parsed.latitude &&
          cached.longitude === parsed.longitude &&
          cached.label === parsed.label
        ) {
          return cached;
        }
        cached = parsed;
        return cached;
      }
    } catch {
      /* ignore */
    }
  }
  return FALLBACK;
}

export function setSavedLocation(point: GeoPoint) {
  cached = point;
  localStorage.setItem(KEY, JSON.stringify(point));
  window.dispatchEvent(new Event("goluto-location"));
}

export function locationQuery(point = getSavedLocation()) {
  return {
    latitude: point.latitude.toFixed(6),
    longitude: point.longitude.toFixed(6),
  };
}

export function requestBrowserLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Current location",
        };
        setSavedLocation(point);
        resolve(point);
      },
      () => reject(new Error("Could not read your location.")),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}
