"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorBox, Field, controlClass, inputClass } from "@/components/ui";
import { completeFirebaseLogin } from "@/lib/consumerAuth";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import {
  confirmPhoneOtp,
  isFirebaseConfigured,
  mapFirebaseError,
  resetRecaptcha,
  sendPhoneOtp,
  signInWithApple,
  signInWithGoogle,
  toE164,
} from "@/lib/firebaseAuth";

const countries = [
  { code: "DE", dial: "+49", label: "Germany +49" },
  { code: "AT", dial: "+43", label: "Austria +43" },
  { code: "CH", dial: "+41", label: "Switzerland +41" },
  { code: "NL", dial: "+31", label: "Netherlands +31" },
  { code: "FR", dial: "+33", label: "France +33" },
  { code: "PL", dial: "+48", label: "Poland +48" },
];

export function ConsumerAuthForm() {
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+49");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"google" | "apple" | "sms" | "otp" | "">("");

  function showError(err: unknown) {
    setError(err instanceof ApiError ? errorMessage(err) : mapFirebaseError(err));
  }

  async function finish(idToken: string, displayName?: string) {
    await completeFirebaseLogin(idToken, displayName);
    router.replace("/");
  }

  async function social(kind: "google" | "apple") {
    setBusy(kind);
    setError("");
    try {
      const token = kind === "google" ? await signInWithGoogle() : await signInWithApple();
      await finish(token);
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const e164 = toE164(phone, dial);
    const digits = e164.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      setError("Enter a valid phone number.");
      return;
    }
    setBusy("sms");
    setError("");
    try {
      await sendPhoneOtp(e164);
      setStep("otp");
    } catch (err) {
      resetRecaptcha();
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) {
      setError("Enter the SMS code.");
      return;
    }
    setBusy("otp");
    setError("");
    try {
      const token = await confirmPhoneOtp(code);
      await finish(token, name);
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  if (!configured) {
    return (
      <ErrorBox message="Firebase web login is not configured yet. Add a Web app in the Firebase Console and set NEXT_PUBLIC_FIREBASE_APP_ID in .env.local." />
    );
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorBox message={error} /> : null}

      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() => social("google")}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-line hover:bg-paper disabled:opacity-50"
      >
        <GoogleMark />
        {busy === "google" ? "Connecting…" : "Continue with Google"}
      </button>
      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() => social("apple")}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold !text-white hover:bg-ink/90 disabled:opacity-50"
      >
        <AppleMark />
        {busy === "apple" ? "Connecting…" : "Continue with Apple"}
      </button>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <span className="h-px flex-1 bg-line" />
        or phone
        <span className="h-px flex-1 bg-line" />
      </div>

      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <Field label="Name (optional)">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Mobile number">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
              <select
                className={`${controlClass} w-auto min-w-[7.25rem]`}
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                aria-label="Country code"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.dial}>
                    {country.code} {country.dial}
                  </option>
                ))}
              </select>
              <input
                className={`${controlClass} min-w-0 w-full`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="170 1234567"
                required
              />
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={Boolean(busy)}>
            {busy === "sms" ? "Sending code…" : "Send SMS code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <p className="text-sm text-muted">
            Enter the code sent to {toE164(phone, dial)}.
          </p>
          <Field label="SMS code">
            <input
              className={`${inputClass} tracking-[0.3em]`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </Field>
          <Button type="submit" className="w-full" disabled={Boolean(busy)}>
            {busy === "otp" ? "Verifying…" : "Verify and continue"}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-semibold text-muted hover:text-ink"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
              resetRecaptcha();
            }}
          >
            Use a different number
          </button>
        </form>
      )}
      <div id="recaptcha-container" />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.6 9.2c0-.7-.1-1.3-.2-1.9H9v3.6h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 16.1 5.5 18 9 18Z" />
      <path fill="#FBBC05" d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.5 0 9s.3 2.8.9 4l3-2.3Z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5C13.5.8 11.4 0 9 0 5.5 0 2.4 1.9.9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M12.7 9.4c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.8c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.7-3.9ZM10.8 3.1c.7-.8 1.1-1.9 1-3.1-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.4Z" />
    </svg>
  );
}
