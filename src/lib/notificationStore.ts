import { create } from "zustand";

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  zaman: string;
  okundu: boolean;
}

interface NotificationState {
  bildirimler: Bildirim[];
  panelAcik: boolean;
  paneliAcKapat: () => void;
  okunduOlarakIsaretle: (id: string) => void;
}

export const useNotifications = create<NotificationState>((set) => ({
  panelAcik: false,
  bildirimler: [
    {
      id: "1",
      baslik: "Su Hatırlatması",
      mesaj: "Günlük hedefine ulaşmak için 2 bardak daha su içmelisin.",
      zaman: "15 dk önce",
      okundu: false,
    },
    {
      id: "2",
      baslik: "Haftalık Tempo",
      mesaj: "Haftalık 50.000 adım hedefine %80 oranında yaklaştın.",
      zaman: "2 saat önce",
      okundu: false,
    },
    {
      id: "3",
      baslik: "Beslenme Serisi",
      mesaj: "Dünkü disiplinli beslenmenle zinciri 7 güne çıkardın.",
      zaman: "Dün",
      okundu: true,
    },
  ],

  paneliAcKapat: () => set((s) => ({ panelAcik: !s.panelAcik })),
  okunduOlarakIsaretle: (id) =>
    set((s) => ({
      bildirimler: s.bildirimler.map((b) => (b.id === id ? { ...b, okundu: true } : b)),
    })),
}));