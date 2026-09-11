# ISTE Event Registration Module — Complete Technical Guide

This module manages student event registrations with backend persistence directly into Google Sheets via the official Google Sheets API, featuring UPI QR code payment generation, duplicate prevention, and an auth-gated admin management portal.

---

## 1. User & Admin Flows

### Student Registration Flow
1. **Public Form**: Student navigates to `/events/[slug]/register` (e.g. `/events/tech-quiz/register`).
2. **Client Validation**: Name, Email, 10-digit Indian phone format, College/Department, and Year of study are validated inline.
3. **Backend Processing (`POST /api/register`)**:
   - Validates input with Zod schemas.
   - Enforces IP-based rate limiting.
   - Checks Google Sheets for duplicate registrations (`eventId` + `email`). Returns `409 Conflict` if duplicate.
   - Appends registration row to Google Sheets (`Registrations` tab).
   - Generates a custom UPI payment QR code (`upi://pay?pa=...`) containing a generated UUID `registrationId`.
4. **UPI Payment & UTR Confirmation**:
   - Student scans the QR code with any UPI app (Google Pay, PhonePe, Paytm).
   - Student enters their 12-digit UPI UTR / Transaction Reference number (`POST /api/register/confirm-payment`).
   - Payment status updates to `"Awaiting Verification"` in Google Sheets.
5. **Self-Service Lookup**:
   - Students can check their existing registration ID and payment status at any time via the lookup modal (`POST /api/register/lookup`).

### Admin Management Flow
1. **Admin Authentication**:
   - Coordinator navigates to `/admin/login`.
   - Authenticates via Supabase Auth (`signInWithPassword`).
   - Email is verified against the `ADMIN_EMAILS` allow-list. Non-admins are immediately logged out.
2. **Dashboard (`/admin/dashboard`)**:
   - Protected by Next.js 16 `proxy.ts` edge check and server component session verification.
   - Displays all registered candidates from Google Sheets.
   - Real-time client-side search and filtering across Name, Email, Phone, Event ID, and UTR numbers.
   - **Verify Payment**: One-click action calling `/api/admin/verify-payment`, updating `PaymentStatus` to `"Confirmed"` in Google Sheets.
   - **Export CSV**: One-click download of filtered records to a standard `.csv` file.

---

## 2. All Required Environment Variables (.env.local)

```env
# ── Google Sheets API Service Account ──────────────────────────────────────────
GOOGLE_SHEETS_CLIENT_EMAIL="iste-service-account@your-gcp-project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"

# ── UPI Payment Credentials ───────────────────────────────────────────────────
UPI_ID="istembcet@upi"
UPI_PAYEE_NAME="ISTE SC MBCET"

# ── Admin Portal Access Allow-List (Comma-separated emails) ───────────────────
ADMIN_EMAILS="admin@iste.org,anandu@example.com"

# ── Supabase Auth (Existing Project Credentials) ──────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 3. Known Limitations & Architectural Notes

1. **In-Memory Rate Limiting**: The server-side rate limiter (`max 5 requests / IP / minute`) operates in memory. It resets when the Next.js server restarts and does not synchronize across multi-region serverless clusters.
2. **Fixed Event Fee**: The registration fee is currently hardcoded (`EVENT_FEE_INR = 100`) in `/api/register/route.ts` as a placeholder constant. Future iterations can retrieve per-event pricing from Sanity CMS or Prisma DB.
3. **Google Sheets API Rate Limits**: Read/write operations use Google Sheets API v4. Google enforces a default limit of 100 requests per 100 seconds per user.
4. **Manual Payment Verification**: Payment confirmation relies on student-submitted UTR numbers verified manually by admins via bank statements before clicking "Verify Payment".
