import Link from "next/link";

export const cardClass =
  "group rounded-2xl bg-white shadow-card outline outline-1 outline-black/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift";

export const controlClass =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-muted/80 focus:border-deal focus:ring-4 focus:ring-deal/10";

export const inputClass = `w-full ${controlClass}`;

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink/80">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-deal-deep text-white shadow-sm hover:bg-deal",
    ghost: "bg-white text-ink ring-1 ring-line hover:bg-paper",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "deal";
}) {
  const styles = {
    neutral: "bg-paper text-muted ring-line",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    warning: "bg-amber-50 text-amber-800 ring-amber-100",
    danger: "bg-red-50 text-red-700 ring-red-100",
    deal: "bg-deal-soft text-deal-ink ring-deal/10",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles}`}>
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
        {inner}
      </Link>
    );
  }
  return <div className="card p-4">{inner}</div>;
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="text-muted hover:text-ink" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm font-semibold"
    >
      <span className={`relative h-6 w-10 rounded-full transition ${checked ? "bg-deal-deep" : "bg-line"}`}>
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition"
          style={{ left: checked ? "1.15rem" : "0.15rem" }}
        />
      </span>
      {label}
    </button>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className={`${cardClass} px-6 py-12 text-center`}>
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-deal-soft text-lg font-extrabold text-deal">
        %
      </div>
      <p className="font-bold">{title}</p>
      {body ? <p className="mt-1 text-sm text-muted">{body}</p> : null}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="mt-2 font-bold underline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  actions,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {action ? (
          <Link
            href={action.href}
            className="rounded-xl bg-deal-deep px-3.5 py-1.5 text-sm font-bold !text-white shadow-sm"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function Cover({ src, label }: { src?: string | null; label: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
      />
    );
  }
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-deal-soft to-[#dfc4c4] text-xl font-extrabold text-deal">
      {label.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-[1.45rem] font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
