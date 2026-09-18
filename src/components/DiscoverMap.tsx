"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MapBranch } from "@/lib/types";
import { percent } from "@/lib/format";

type Props = {
  branches: MapBranch[];
  center: { latitude: number; longitude: number };
  onSelect?: (branch: MapBranch) => void;
};

const TAG_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M21.41 11.58 12.41 2.58A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 0-2.83ZM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8Z"/></svg>`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markerHtml(label: string) {
  return `<div class="aajhee-marker">
    <div class="aajhee-marker-pill">
      <span class="aajhee-marker-icon">${TAG_SVG}</span>
      <span class="aajhee-marker-label">${escapeHtml(label)}</span>
    </div>
    <span class="aajhee-marker-pointer"></span>
    <span class="aajhee-marker-dot"></span>
  </div>`;
}

export function DiscoverMap({ branches, center, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const L = await import("leaflet");
      if (!el.current || cancelled) return;

      if (!mapRef.current) {
        mapRef.current = L.map(el.current, { zoomControl: true, scrollWheelZoom: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
        markersRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const map = mapRef.current;
      map.setView([center.latitude, center.longitude], 13);
      markersRef.current?.clearLayers();

      branches.forEach((branch) => {
        const lat = Number(branch.latitude);
        const lng = Number(branch.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        const off = percent(branch.highest_discount_percent);
        const label = off ? `${off} off` : "Deal";
        const icon = L.divIcon({
          className: "aajhee-marker-wrap",
          html: markerHtml(label),
          iconSize: [168, 72],
          iconAnchor: [84, 70],
        });
        const marker = L.marker([lat, lng], { icon, riseOnHover: true });
        marker.bindTooltip(branch.business_name, {
          direction: "top",
          offset: [0, -72],
          opacity: 0.95,
        });
        marker.on("click", () => onSelectRef.current?.(branch));
        markersRef.current?.addLayer(marker);
      });
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [branches, center.latitude, center.longitude]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  return (
    <div
      ref={el}
      className="h-[420px] w-full overflow-hidden rounded-2xl shadow-card outline outline-1 outline-black/5 md:h-[520px]"
    />
  );
}
