# Goluto web app

Consumer + merchant web client for the Goluto API (`https://api.goluto.de`). This is a separate Next.js app — it is not the marketing site in `GoLuto-backend/website`.

## What it covers

Matches the Flutter apps (without camera QR scanning):

- **Home** — top picks, all offers, Online / In-store filters
- **Discover** — nearby branches on OpenStreetMap
- **Stores** — branch list and store pages
- **Search, favorites, notifications, addresses, profile**
- **Merchant dashboard** — login/register, branches, offers

Online offers open the shop URL. In-store offers are shown at the counter (no scanner on web).

## Run locally

```bash
cd goluto-web
cp .env.example .env.local   # already defaults to the live API
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To hit a local Django API instead:

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

CORS on the API already allows `localhost`.

## Auth

- **Customers:** Google, Apple, or phone OTP via Firebase, then `POST /api/auth/firebase` with the Firebase ID token
- **Merchants:** email + password at `/business/login` and `/business/register`

### Firebase web setup

The mobile apps already use project `goluto-c5020`. The web client needs a **Web app** in that same project.

1. Firebase Console → Project settings → Your apps → **Add app → Web**.
2. Copy the `appId` into `.env.local` as `NEXT_PUBLIC_FIREBASE_APP_ID`.
3. Authentication → Sign-in method: enable **Google**, **Apple**, and **Phone** (same as the app).
4. Authentication → Settings → **Authorized domains**: add `localhost`, `127.0.0.1`, and your production host.
5. **Google:** use the existing Web client ID (`860507972929-b78dmgqil7d22nqkad9avm6akaf95pec`).
6. **Apple on web:** Firebase Apple provider needs an Apple **Services ID** (web), not only the iOS app ID. If that is not set up yet, the Apple button will fail until it is.
7. **Phone:** Firebase does not send real SMS from `localhost` (`auth/invalid-app-credential`). For local testing, add a **test phone number + code** under Authentication → Sign-in method → Phone. Optionally try [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login). Live SMS needs Blaze billing, Germany (DE) in SMS region policy, and a deployed `https` host.

Restart `npm run dev` after changing `.env.local`.
