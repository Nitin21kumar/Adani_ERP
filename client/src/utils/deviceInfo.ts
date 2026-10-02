/** Lightweight User-Agent parsing (no external lib) to fill browser/OS/device on attendance login. */
export function detectDeviceInfo() {
  const ua = navigator.userAgent;

  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Chromium")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  const device = /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";

  return { browser, os, device };
}

/** Reverse-geocodes lat/lng to a human-readable address via OpenStreetMap Nominatim (free, no API key). */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}
