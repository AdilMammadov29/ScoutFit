import { useDiet, type GunDurumu } from "../lib/nutritionStore";
export function DietStreakCard() {
  const { seri, bugunkuDurum, telafiPlani, durumSec } = useDiet();

  const secenekler: { id: GunDurumu; baslik: string; aciklama: string }[] = [
    { id: "temiz", baslik: "Plana Sadık", aciklama: "Hedef kalori/porsiyon korundu" },
    { id: "dengeli", baslik: "Dengeli", aciklama: "Ufak sapma, kontrol elinde" },
    { id: "kacamak", baslik: "Kaçamak", aciklama: "Ağır öğün veya geç saat tüketimi" },
  ];

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
            Beslenme Disiplini
          </span>
          <h3 className="font-display text-lg font-bold text-ink">Günün Değerlendirmesi</h3>
        </div>

        <div className="text-right">
          <span className="font-mono text-2xl font-bold tabular-nums text-pine">
            {seri}
          </span>
          <span className="ml-1 text-xs text-muted">gün seri</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-3">
        {secenekler.map((item) => {
          const secili = bugunkuDurum === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => durumSec(item.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                secili
                  ? "border-pine bg-cream ring-1 ring-pine/30"
                  : "border-line bg-cream/40 hover:border-line/80 hover:bg-cream"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    secili ? "text-pine" : "text-ink"
                  }`}
                >
                  {item.baslik}
                </span>
                {secili && (
                  <span className="h-1.5 w-1.5 rounded-full bg-pine" />
                )}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted">
                {item.aciklama}
              </p>
            </button>
          );
        })}
      </div>

      {telafiPlani && (
        <div className="mt-4 rounded-xl border border-clay/30 bg-clay/5 p-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-clay">
              Dengeleme Reçetesi
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink/90">
            {telafiPlani}
          </p>
        </div>
      )}
    </div>
  );
}