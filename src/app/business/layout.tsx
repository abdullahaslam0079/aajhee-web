"use client";

import { usePathname } from "next/navigation";
import { BusinessShell } from "@/components/BusinessShell";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/business/login" || pathname === "/business/register") {
    return <>{children}</>;
  }
  return <BusinessShell>{children}</BusinessShell>;
}
