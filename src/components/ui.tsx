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
    <header className="mb-8">
      <p className="text-sm tabular-nums text-muted">{index}</p>
      <h1 className="mt-1 font-display text-4xl leading-tight text-ink">{title}</h1>
      <p className="mt-2 max-w-md leading-relaxed text-muted">{lede}</p>
    </header>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-cream">
      {title ? (
        <h2 className="border-b border-line px-5 py-4 text-sm font-medium text-ink">{title}</h2>
      ) : null}
      <div className="px-5">{children}</div>
    </section>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-b-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}

export const fieldClass =
  "min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-pine";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
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
      ? "bg-pine text-cream"
      : tone === "quiet"
        ? "border border-line bg-paper text-ink"
        : "bg-transparent text-muted";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 ${look}`}
    >
      {children}
    </button>
  );
}