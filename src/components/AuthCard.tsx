import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-deal-deep px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -right-10 h-80 w-80 rounded-full bg-black/20" />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <img src="/icon.png" alt="" className="h-11 w-11 rounded-xl bg-white" />
          <span className="font-display text-2xl font-semibold">Aajhee</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">Sparen in Deutschland.</p>
          <p className="mt-4 text-base leading-7 text-white/80">
            Find in-store and online deals from stores around you — then show the offer at the
            counter or shop from the link.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/60">Deals near you, without the noise.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lift outline outline-1 outline-black/5 lg:shadow-none lg:outline-none">
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-black/5" />
            <span className="font-display text-lg font-semibold tracking-tight">Aajhee</span>
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
