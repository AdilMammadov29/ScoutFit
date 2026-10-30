import type { ReactNode } from "react";

export function PageTitle({
  index,
  title,
  lede,
}: {
  index: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="mb-6 font-sans">
      <span className="text-[13px] font-medium text-muted block leading-none">
        {index}
      </span>
      <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
        {lede}
      </p>
    </header>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface font-sans shadow-sm">
      {title ? (
        <h2 className="border-b border-line px-5 py-3.5 font-serif text-base font-bold text-ink">
          {title}
        </h2>
      ) : null}
      <div className="px-5">{children}</div>
    </section>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-b-0 font-sans">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-right font-serif text-sm font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}

export const fieldClass =
  "min-h-[44px] w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 transition-colors focus:border-muted/60";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block font-sans">
      <span className="mb-1.5 block text-[13px] text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Btn({
  children,
  onClick,
  tone = "primary",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "quiet" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const look =
    tone === "primary"
      ? "bg-pine text-paper hover:opacity-95 active:scale-95 shadow-sm"
      : tone === "quiet"
        ? "border border-line bg-paper text-ink hover:border-muted/40 active:scale-95"
        : "bg-transparent text-muted hover:text-ink";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${look}`}
    >
      {children}
    </button>
  );
}