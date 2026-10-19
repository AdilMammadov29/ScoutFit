import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function HaritaMerkezleyici({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export function GpsTracker() {
  const [simdikiKonum, setSimdikiKonum] = useState<[number, number]>([37.7648, 30.5566]);
  const [rota, setRota] = useState<Array<[number, number]>>([]);
  const [adim, setAdim] = useState(0);
  const [kalori, setKalori] = useState(0);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setHata("Tarayıcınız konum servislerini desteklemiyor.");
      return;
    }

    // Sayfa açıldığı an otomatik konum takibi başlar
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const yeniNokta: [number, number] = [latitude, longitude];
        setSimdikiKonum(yeniNokta);
        setRota((onceki) => [...onceki, yeniNokta]);
      },
      (err) => setHata("Konum alınamadı: " + err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    // Telefonun sensörü ile otomatik adım sayar (Hiçbir tuşa basmadan arka planda çalışır)
    let sonIvme = 0;
    let sonAdimZamani = 0;
    const adimSayarAlgila = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const toplamIvme = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      
      if (Math.abs(toplamIvme - sonIvme) > 3.0) {
        const simdi = Date.now();
        if (simdi - sonAdimZamani > 300) {
          setAdim((a) => {
            const yeniAdim = a + 1;
            // Her adım yaklaşık 0.04 kcal yaktığı varsayımıyla otomatik kalori hesabı
            setKalori(Math.round(yeniAdim * 0.04));
            return yeniAdim;
          });
          sonAdimZamani = simdi;
        }
      }
      sonIvme = toplamIvme;
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", adimSayarAlgila);
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (window.DeviceMotionEvent) {
        window.removeEventListener("devicemotion", adimSayarAlgila);
      }
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6 text-white space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#6f9f87]">Otomatik Hareket & Rota Takibi</h2>
        <p className="text-sm text-gray-400">Hiçbir tuşa basmana gerek yok. Telefonun cebindeyken adımların ve rotan anlık olarak işlenir.</p>
      </div>

      {hata && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{hata}</div>
      )}

      {/* CANLI HARİTA */}
      <div className="h-[380px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
        <MapContainer center={simdikiKonum} zoom={17} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HaritaMerkezleyici center={simdikiKonum} />
          <Marker position={simdikiKonum}>
            <Popup>Anlık Konumun 🚀</Popup>
          </Marker>
          {rota.length > 1 && <Polyline positions={rota} color="#6f9f87" weight={5} />}
        </MapContainer>
      </div>

      {/* OTOMATİK İSTATİSTİKLER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 text-center shadow-xl">
          <span className="text-xs uppercase tracking-wider text-gray-400 mb-1">Otomatik Adım Sayısı</span>
          <div className="text-4xl font-black text-white">{adim} <span className="text-lg font-normal text-gray-300">adım</span></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 text-center shadow-xl">
          <span className="text-xs uppercase tracking-wider text-gray-400 mb-1">Yakılan Ekstra Kalori</span>
          <div className="text-4xl font-black text-[#6f9f87]">{kalori} <span className="text-lg font-normal text-gray-300">kcal</span></div>
        </div>
      </div>
    </div>
  );
}