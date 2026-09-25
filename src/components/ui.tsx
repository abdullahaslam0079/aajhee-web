import Link from "next/link";

export const cardClass =
  "group rounded-2xl bg-white shadow-card outline outline-1 outline-black/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift";

export const controlClass =
  "rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-muted/80 focus:border-deal focus:ring-4 focus:ring-deal/10";

export const inputClass = `w-full ${controlClass}`;

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink/80">{label}</span>
      {children}
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
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-xl bg-deal-deep px-3.5 py-1.5 text-sm font-bold !text-white shadow-sm"
        >
          {action.label}
        </Link>
      ) : null}
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
