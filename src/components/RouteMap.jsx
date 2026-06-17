import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import { Map } from "lucide-react";
import { activitiesApi } from "../services/api";
import "leaflet/dist/leaflet.css";
import "../styles/RouteMap.css";

export default function RouteMap({ activityId, height = 220 }) {
  const [coordinates, setCoordinates] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!activityId) return;

    activitiesApi
      .getRoute(activityId)
      .then((res) => setCoordinates(res.data.coordinates || []))
      .catch(() => setFailed(true));
  }, [activityId]);

  if (failed || (coordinates && coordinates.length === 0)) {
    return (
      <div className="route-map-placeholder" style={{ height }}>
        <Map size={28} />
        <span>Pas de tracé GPS pour cette sortie</span>
      </div>
    );
  }

  if (!coordinates) {
    return <div className="route-map-placeholder" style={{ height }} />;
  }

  const positions = coordinates;
  const start = positions[0];
  const end = positions[positions.length - 1];

  return (
    <div className="route-map" style={{ height }}>
      <MapContainer
        bounds={positions}
        boundsOptions={{ padding: [16, 16] }}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={positions} color="#FFE600" weight={4} />
        <CircleMarker center={start} radius={6} color="#050505" fillColor="#FFE600" fillOpacity={1} />
        <CircleMarker center={end} radius={6} color="#FFE600" fillColor="#050505" fillOpacity={1} />
      </MapContainer>
    </div>
  );
}
