import {
  ConfirmationResult,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

let recaptcha: RecaptchaVerifier | null = null;
let confirmation: ConfirmationResult | null = null;

export { isFirebaseConfigured };

export function resetRecaptcha() {
  recaptcha?.clear();
  recaptcha = null;
}

function ensureRecaptcha() {
  const auth = getFirebaseAuth();
  if (recaptcha) return recaptcha;
  recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
  });
  return recaptcha;
}

function isIndexedDbHiddenError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: string }).message)
      : String(error);
  return /database is closing/i.test(message) || /closing\/hidden/i.test(message);
}

async function idTokenFromCurrentUser() {
  const user = getFirebaseAuth().currentUser;
  const token = await user?.getIdToken();
  if (!token) throw new Error("Could not get Firebase ID token.");
  return token;
}

async function signInWithProvider(provider: GoogleAuthProvider | OAuthProvider) {
  try {
    await signInWithPopup(getFirebaseAuth(), provider);
  } catch (error) {
    // Popup often succeeds; persistence then fails in hidden/embedded browsers.
    if (!isIndexedDbHiddenError(error) || !getFirebaseAuth().currentUser) {
      throw error;
    }
  }
  return idTokenFromCurrentUser();
}

export async function signInWithGoogle(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  return signInWithProvider(provider);
}

export async function signInWithApple(): Promise<string> {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return signInWithProvider(provider);
}

export async function sendPhoneOtp(e164Phone: string) {
  const verifier = ensureRecaptcha();
  await verifier.render();
  confirmation = await signInWithPhoneNumber(getFirebaseAuth(), e164Phone, verifier);
}

export async function confirmPhoneOtp(smsCode: string): Promise<string> {
  if (!confirmation) throw new Error("Request a verification code first.");
  await confirmation.confirm(smsCode.trim());
  confirmation = null;
  return idTokenFromCurrentUser();
}

export async function signOutFirebase() {
  if (!isFirebaseConfigured()) return;
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* ignore */
  }
  resetRecaptcha();
  confirmation = null;
}

export function mapFirebaseError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  const message =
    typeof error === "object" && error && "message" in error ? String((error as { message: string }).message) : "";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This domain is not allowed in Firebase. Add localhost (and your production host) under Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled in Firebase. Enable Google, Apple, or Phone under Authentication → Sign-in method.";
    case "auth/invalid-phone-number":
      return "Enter a valid phone number with country code.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/invalid-verification-code":
      return "Invalid verification code. Please try again.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "Verification session expired. Request a new code.";
    case "auth/missing-app-credential":
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
      return "Firebase will not send a real SMS from localhost. Add a test phone number under Authentication → Sign-in method → Phone, or open the app at http://127.0.0.1:3000/login after adding 127.0.0.1 to Authorized domains. Live SMS works on a deployed https domain.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/invalid-api-key":
    case "auth/invalid-app-id":
      return "Firebase web config looks wrong. Check NEXT_PUBLIC_FIREBASE_* in .env.local.";
    default:
      if (/database is closing/i.test(message) || /closing\/hidden/i.test(message)) {
        return "Sign-in could not finish in this browser view. Open http://localhost:3000/login in Chrome or Safari and try again.";
      }
      if (message.toLowerCase().includes("billing")) {
        return "Firebase Phone Auth requires the Blaze plan for live SMS.";
      }
      return message || "Sign-in failed. Please try again.";
  }
}

export function toE164(rawNational: string, dialCode: string) {
  let digits = rawNational.trim().replace(/\D/g, "");
  if (rawNational.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) digits = digits.slice(1);
  const countryDigits = dialCode.replace("+", "");
  if (digits.startsWith(countryDigits) && digits.length > countryDigits.length) {
    return `+${digits}`;
  }
  return `${dialCode}${digits}`;
}
