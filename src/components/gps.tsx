import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useFit } from "@/lib/store";
import { useSettingsStore } from "@/lib/settingsStore";
import { triggerHaptic, speakFeedback } from "@/lib/feedback";
import { Geolocation } from "@capacitor/geolocation";
import {
  Compass,
  Play,
  Square,
  AlertCircle,
  Footprints,
  Flame,
  Clock,
  Gauge,
  Navigation,
} from "lucide-react";

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
  const settings = useSettingsStore((s) => s.settings);

  const [aktif, setAktif] = useState(false);
  const [sure, setSure] = useState(0);
  const [mesafe, setMesafe] = useState(0);
  const [hiz, setHiz] = useState(0);
  const [rota, setRota] = useState<Array<[number, number]>>([]);
  const [simdikiKonum, setSimdikiKonum] = useState<[number, number]>([37.7648, 30.5566]);

  const sonKilometreRef = useRef<number>(0);

  const [aktiviteler, setAktiviteler] = useState<any[]>(() => {
    try {
      const kayitli = localStorage.getItem("scoutfit_gps_aktiviteler");
      return kayitli ? JSON.parse(kayitli) : [];
    } catch {
      return [];
    }
  });

  const [hata, setHata] = useState<string | null>(null);

  const watchIdRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem("scoutfit_gps_aktiviteler", JSON.stringify(aktiviteler));
    } catch {}
  }, [aktiviteler]);

  // Sayfa açıldığında bir kere konum al
  useEffect(() => {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      .then((pos) => {
        setSimdikiKonum([pos.coords.latitude, pos.coords.longitude]);
      })
      .catch(() => {});
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

  const antrenmaniBaslat = async () => {
    setHata(null);

    try {
      // Önce izin iste
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
        setHata("Konum izni verilmedi. Ayarlardan konum iznini açın.");
        return;
      }

      triggerHaptic("start");
      speakFeedback("Antrenman başladı.");

      setAktif(true);
      setSure(0);
      setMesafe(0);
      setRota([]);
      sonKilometreRef.current = 0;

      // Capacitor Geolocation ile izlemeye başla
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        },
        (position, err) => {
          if (err) {
            setHata("Konum alınamadı: " + (err.message || String(err)));
            return;
          }
          if (!position) return;

          const { latitude, longitude, speed } = position.coords;
          const yeniNokta: [number, number] = [latitude, longitude];

          setSimdikiKonum(yeniNokta);
          setHiz(speed !== null && speed >= 0 ? Number((speed * 3.6).toFixed(1)) : 0);

          setRota((onceki) => {
            if (onceki.length > 0) {
              const [sonLat, sonLng] = onceki[onceki.length - 1];
              const ekMesafe = mesafeHesapla(sonLat, sonLng, latitude, longitude);
              if (ekMesafe < 0.5) {
                setMesafe((m) => {
                  const yeniMesafe = Number((m + ekMesafe).toFixed(3));

                  // Her tam kilometrede ses + titreşim
                  const suAnkiKm = Math.floor(yeniMesafe);
                  if (suAnkiKm > sonKilometreRef.current) {
                    sonKilometreRef.current = suAnkiKm;
                    triggerHaptic("milestone");
                    speakFeedback(`${suAnkiKm} kilometre tamamlandı.`);
                  }

                  return yeniMesafe;
                });
              }
            }
            return [...onceki, yeniNokta];
          });
        }
      );

      watchIdRef.current = id;
    } catch (e: any) {
      console.error(e);
      setHata("GPS başlatılamadı: " + (e?.message || String(e)));
      setAktif(false);
    }
  };

  const antrenmaniBitir = async () => {
    if (watchIdRef.current !== null) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      } catch {}
      watchIdRef.current = null;
    }
    setAktif(false);

    triggerHaptic("stop");
    speakFeedback(`Antrenman tamamlandı. ${mesafe.toFixed(2)} kilometre.`);

    if (mesafe > 0 || sure > 5) {
      const yeniAktivite = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        tarih: new Date().toLocaleDateString("tr-TR"),
        sure,
        mesafe,
        adim: hesaplananAdim,
        kalori: harcananKalori,
        ortalamaHiz: sure > 0 ? (mesafe / (sure / 3600)).toFixed(1) : "0",
      };

      setAktiviteler((prev) => [yeniAktivite, ...prev]);

      // Çevrimdışı koruma
      if (settings.offlineSync) {
        try {
          const offlineQueue = JSON.parse(localStorage.getItem("scoutfit_offline_queue") || "[]");
          offlineQueue.push(yeniAktivite);
          localStorage.setItem("scoutfit_offline_queue", JSON.stringify(offlineQueue));
        } catch {}
      }

      // Zustand store kaydı
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
    return sa > 0
      ? `${sa}:${dk < 10 ? "0" : ""}${dk}:${sn < 10 ? "0" : ""}${sn}`
      : `${dk}:${sn < 10 ? "0" : ""}${sn}`;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-line pb-3">
        <h2 className="font-serif text-xl font-bold text-ink">
          GPS Rota & Adım Takibi
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Antrenmanı başlat, rotan haritada çizilsin; mesafen ve adımların hesaplansın.
        </p>
      </div>

      {hata && (
        <div className="flex items-center gap-2 rounded-xl border border-clay/30 bg-clay/5 p-3.5 text-[13px] text-clay">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{hata}</span>
        </div>
      )}

      {/* HARİTA */}
      <div className="h-[340px] w-full rounded-xl overflow-hidden border border-line bg-surface shadow-sm relative z-0">
        <MapContainer
          center={simdikiKonum}
          zoom={17}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HaritaMerkezleyici center={simdikiKonum} />
          <Marker position={simdikiKonum}>
            <Popup>Anlık Konumun</Popup>
          </Marker>

          {settings.livePolyline && rota.length > 1 && (
            <Polyline positions={rota} color="#2d5a43" weight={4} />
          )}
        </MapContainer>
      </div>

      {/* İSTATİSTİKLER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <span className="text-[12px] text-muted block mb-1">Mesafe</span>
          <div className="font-serif text-2xl font-bold text-pine">
            {mesafe.toFixed(2)} <span className="font-sans text-[12px] font-normal text-muted">km</span>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <span className="text-[12px] text-muted block mb-1">Adım</span>
          <div className="font-serif text-2xl font-bold text-ink">
            {hesaplananAdim.toLocaleString()} <span className="font-sans text-[12px] font-normal text-muted">adım</span>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <span className="text-[12px] text-muted block mb-1">Kalori</span>
          <div className="font-serif text-2xl font-bold text-ink">
            {harcananKalori} <span className="font-sans text-[12px] font-normal text-muted">kcal</span>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <span className="text-[12px] text-muted block mb-1">Süre</span>
          <div className="font-serif text-2xl font-bold text-ink">{sureyiFormatla(sure)}</div>
        </div>
      </div>

      {/* KONTROL BUTONU */}
      <div className="flex justify-center pt-1">
        {!aktif ? (
          <button
            type="button"
            onClick={antrenmaniBaslat}
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-pine px-8 py-3 text-[14px] font-medium text-paper transition-opacity duration-150 hover:opacity-95 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Antrenmanı Başlat</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={antrenmaniBitir}
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-clay px-8 py-3 text-[14px] font-medium text-paper transition-opacity duration-150 hover:opacity-95 active:scale-95"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Antrenmanı Bitir & Kaydet</span>
          </button>
        )}
      </div>

      {/* GEÇMİŞ */}
      {aktiviteler.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-serif text-base font-bold text-ink mb-3">Geçmiş GPS Kayıtları</h3>
          <div className="divide-y divide-line">
            {aktiviteler.map((a) => (
              <div
                key={a.id}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] font-medium text-pine">{a.tarih}</span>
                  <div className="font-serif text-[15px] font-bold text-ink mt-0.5">
                    {a.mesafe} km · {sureyiFormatla(a.sure)}
                  </div>
                  <span className="text-[12px] text-muted mt-0.5 block">
                    {a.adim} adım · ort. {a.ortalamaHiz} km/s
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-sm font-semibold text-ink">
                    {a.kalori} kcal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}