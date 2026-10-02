import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Attendance } from "@/types/attendance";

// Default Leaflet marker icons don't load correctly under bundlers unless
// explicitly re-pointed at the CDN assets — standard fix for react-leaflet + Vite.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface AttendanceMapProps {
  records: Attendance[];
  height?: number;
}

export default function AttendanceMap({ records, height = 420 }: AttendanceMapProps) {
  const points = records.flatMap((r) =>
    r.locations.map((loc) => ({
      ...loc,
      employeeName: r.employee?.full_name || "Employee",
      status: r.status,
    }))
  );

  const center: [number, number] = points.length
    ? [points[0].latitude, points[0].longitude]
    : [28.6139, 77.209]; // default: New Delhi, adjust to company HQ

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg">
      <MapContainer center={center} zoom={points.length ? 11 : 4} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{p.employeeName}</p>
                <p className="capitalize text-muted-foreground">{p.event_type} · {p.status}</p>
                {p.full_address && <p className="mt-1 text-xs">{p.full_address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
