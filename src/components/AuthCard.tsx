import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  headline = "Sparen in Deutschland.",
  description = "Find in-store and online deals from stores around you — then show the offer at the counter or shop from the link.",
  tagline = "Deals near you, without the noise.",
  logoSrc = "/logo.png",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headline?: string;
  description?: string;
  tagline?: string;
  logoSrc?: string;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-deal-deep px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -right-10 h-80 w-80 rounded-full bg-black/20" />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Aajhee" className="h-10 w-auto max-w-[160px] object-contain" />
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">{headline}</p>
          <p className="mt-4 text-base leading-7 text-white/80">{description}</p>
        </div>
        <p className="relative z-10 text-sm text-white/60">{tagline}</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lift outline outline-1 outline-black/5 lg:shadow-none lg:outline-none">
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Aajhee" className="h-8 w-auto max-w-[140px] object-contain" />
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

export const MERCHANT_AUTH_BRANDING = {
  headline: "Sell to all of Lahore.",
  description: "List your products, receive orders, and deliver the same day.",
  tagline: "Aajhee for merchants",
  logoSrc: "/logo.png",
} as const;
