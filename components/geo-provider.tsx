"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Coords, GeoStatus } from "@/lib/types";

type GeoContextValue = {
  coords: Coords | null;
  status: GeoStatus;
  concejo: string;
  setConcejo: (value: string) => void;
  requestLocation: () => void;
  showConcejoFallback: boolean;
};

const GeoContext = createContext<GeoContextValue | null>(null);

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [concejo, setConcejo] = useState("");

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus("granted");
      },
      () => {
        setCoords(null);
        setStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  const value = useMemo<GeoContextValue>(
    () => ({
      coords,
      status,
      concejo,
      setConcejo,
      requestLocation,
      showConcejoFallback: status === "denied" || status === "unavailable",
    }),
    [concejo, coords, requestLocation, status],
  );

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo() {
  const context = useContext(GeoContext);
  if (!context) {
    throw new Error("useGeo debe usarse dentro de GeoProvider");
  }
  return context;
}
