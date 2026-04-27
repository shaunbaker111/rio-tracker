import {
  FIREBASE_BASE_URL,
  LOCATION_PATH,
  HISTORY_PATH,
} from "./firebase-config.js";

const latEl = document.getElementById("lat");
const lonEl = document.getElementById("lon");
const batteryEl = document.getElementById("battery");
const rssiEl = document.getElementById("rssi");
const tsEl = document.getElementById("timestamp");

let map;
let marker;
let polyline;

function initMap() {
  map = L.map("map").setView([52.0567, 1.1482], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  marker = L.marker([52.0567, 1.1482]).addTo(map);
  polyline = L.polyline([], { color: "lime", weight: 3 }).addTo(map);
}

function formatTimestamp(ts) {
  if (!ts) return "–";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

async function fetchJson(path) {
  const url = FIREBASE_BASE_URL + path;
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function updateData() {
  try {
    const [location, history] = await Promise.all([
      fetchJson(LOCATION_PATH),
      fetchJson(HISTORY_PATH).catch(() => null),
    ]);

    if (!location || !location.lat || !location.lon) {
      return;
    }

    latEl.textContent = location.lat.toFixed(6);
    lonEl.textContent = location.lon.toFixed(6);
    batteryEl.textContent =
      location.battery !== undefined ? location.battery : "–";
    rssiEl.textContent = location.rssi !== undefined ? location.rssi : "–";
    tsEl.textContent = formatTimestamp(location.timestamp);

    const latLng = [location.lat, location.lon];
    marker.setLatLng(latLng);
    map.setView(latLng, map.getZoom());

    const points = [];

    if (history && typeof history === "object") {
      const entries = Object.values(history);
      entries
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        .forEach((p) => {
          if (p.lat && p.lon) points.push([p.lat, p.lon]);
        });
    }

    // Always include latest point
    points.push(latLng);

    polyline.setLatLngs(points);
  } catch (e) {
    // Silent fail; keep last good data
  }
}

window.addEventListener("load", () => {
  initMap();
  updateData();
  setInterval(updateData, 10000); // every 10s
});
