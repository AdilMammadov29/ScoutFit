import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useFit } from "@/lib/store";

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

function mesafeHesapla(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function GpsTracker() {
  const ekleAntrenman = useFit((s: any) => s.ekleAntrenman);

  const [aktif, setAktif] = useState(false);
  const [sure, setSure] = useState(0);
  const [mesafe, setMesafe] = useState(0);
  const [hiz, setHiz] = useState(0);
  const [rota, setRota] = useState<Array<[number, number]>>([]);
  const [simdikiKonum, setSimdikiKonum] = useState<[number, number]>([37.7648, 30.5566]);

  // Sayfa yenilendiğinde verilerin silinmemesi için localStorage başlangıcı
  const [aktiviteler, setAktiviteler] = useState<any[]>(() => {
    try {
      const kayitli = localStorage.getItem("scoutfit_gps_aktiviteler");
      return kayitli ? JSON.parse(kayitli) : [];
    } catch {
      return [];
    }
  });

  const [hata, setHata] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem("scoutfit_gps_aktiviteler", JSON.stringify(aktiviteler));
    } catch {}
  }, [aktiviteler]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setSimdikiKonum([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (aktif) {
      timerRef.current = setInterval(() => setSure((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [aktif]);

  const hesaplananAdim = Math.round(mesafe * 1350);
  const harcananKalori = Math.round(mesafe * 65);

  const antrenmaniBaslat = () => {
    setHata(null);
    if (!navigator.geolocation) {
      return setHata("Tarayıcınız GPS konum servisini desteklemiyor.");
    }

    setAktif(true);
    setSure(0);
    setMesafe(0);
    setRota([]);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const yeniNokta: [number, number] = [latitude, longitude];

        setSimdikiKonum(yeniNokta);
        setHiz(speed !== null && speed >= 0 ? Number((speed * 3.6).toFixed(1)) : 0);

        setRota((onceki) => {
          if (onceki.length > 0) {
            const [sonLat, sonLng] = onceki[onceki.length - 1];
            const ekMesafe = mesafeHesapla(sonLat, sonLng, latitude, longitude);
            if (ekMesafe < 0.5) {
              setMesafe((m) => Number((m + ekMesafe).toFixed(3)));
            }
          }
          return [...onceki, yeniNokta];
        });
      },
      (err) => setHata("Konum alınamadı: " + err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };

const antrenmaniBitir = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setAktif(false);

    if (mesafe > 0 || sure > 5) {
      const yeniAktivite = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        tarih: new Date().toLocaleDateString("tr-TR"),
        sure,
        mesafe,
        adim: hesaplananAdim,
        kalori: harcananKalori,
        ortalamaHiz: sure > 0 ? (mesafe / (sure / 3600)).toFixed(1) : 0,
      };

      setAktiviteler((prev) => [yeniAktivite, ...prev]);

      // Zustand store'daki Taslak tipine tam uyumlu kayıt:
      if (typeof ekleAntrenman === "function") {
        ekleAntrenman({
          bolge: "Yürüyüş / Koşu (GPS)",
          hareketler: `${mesafe} km, ${hesaplananAdim} adım, ~${harcananKalori} kcal`,
          sureDk: Math.max(1, Math.round(sure / 60)),
        });
      }
    }
  };

  const sureyiFormatla = (saniye: number) => {
    const sa = Math.floor(saniye / 3600);
    const dk = Math.floor((saniye % 3600) / 60);
    const sn = saniye % 60;
    return sa > 0 ? `${sa}:${dk < 10 ? "0" : ""}${dk}:${sn < 10 ? "0" : ""}${sn}` : `${dk}:${sn < 10 ? "0" : ""}${sn}`;
  };

  return (
    <div className="mx-auto max-w-4xl p-6 text-white space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#6f9f87]">GPS Rota & Adım Takibi</h2>
        <p className="text-sm text-gray-400">Başlat düğmesine bas, rotan haritada çizilsin; mesafen ve adımların hesaplansın.</p>
      </div>

      {hata && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{hata}</div>
      )}

      {/* HARİTA GÖRÜNÜMÜ */}
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

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-center shadow-xl">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Mesafe</span>
          <div className="text-3xl font-black text-[#6f9f87]">{mesafe.toFixed(2)} <span className="text-sm font-normal text-gray-300">km</span></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-center shadow-xl">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Adım Sayısı</span>
          <div className="text-3xl font-black text-white">{hesaplananAdim} <span className="text-sm font-normal text-gray-300">adım</span></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-center shadow-xl">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Yakılan Kalori</span>
          <div className="text-3xl font-black text-[#b39573]">{harcananKalori} <span className="text-sm font-normal text-gray-300">kcal</span></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-center shadow-xl">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Süre</span>
          <div className="text-3xl font-black text-white">{sureyiFormatla(sure)}</div>
        </div>
      </div>

      {/* KONTROL BUTONLARI */}
      <div className="flex justify-center gap-4 pt-2">
        {!aktif ? (
          <button
            onClick={antrenmaniBaslat}
            className="rounded-2xl bg-[#6f9f87] px-12 py-4 text-base font-bold text-white shadow-lg shadow-[#6f9f87]/30 transition-all hover:bg-[#5a826e] hover:scale-105"
          >
            Antrenmanı Başlat 🚀
          </button>
        ) : (
          <button
            onClick={antrenmaniBitir}
            className="rounded-2xl bg-red-600 px-12 py-4 text-base font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700 hover:scale-105 animate-pulse"
          >
            Antrenmanı Bitir & Kaydet ⏹️
          </button>
        )}
      </div>

      {/* GEÇMİŞ LİSTESİ */}
      {aktiviteler.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold text-white">Geçmiş Antrenmanlar</h3>
          <div className="space-y-3">
            {aktiviteler.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 shadow-md">
                <div>
                  <span className="text-xs font-semibold text-[#6f9f87]">{a.tarih}</span>
                  <div className="text-lg font-bold text-white mt-0.5">{a.mesafe} km · {sureyiFormatla(a.sure)} · {a.adim} adım</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">Kalori / Hız</span>
                  <div className="text-sm font-semibold text-[#b39573]">{a.kalori} kcal · {a.ortalamaHiz} km/s</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}