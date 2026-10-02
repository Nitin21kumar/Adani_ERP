import { useCallback, useState } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

/** Requests the browser's geolocation on demand (used for attendance login/logout capture). */
export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback((): Promise<Coords | null> => {
    setLoading(true);
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("Geolocation not supported by this browser");
        setLoading(false);
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCoords(result);
          setLoading(false);
          resolve(result);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { coords, error, loading, request };
}
