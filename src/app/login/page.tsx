"use client";

import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ConsumerAuthForm } from "@/components/ConsumerAuthForm";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome"
      subtitle="Sign in with Google, Apple, or your mobile number — same as the Goluto app. No email password."
      footer={
        <Link href="/business/login" className="font-bold text-deal">
          Merchant login
        </Link>
      }
    >
      <ConsumerAuthForm />
    </AuthCard>
  );
}
