# Event Registration & Google Sheets Integration — Status & Setup Guide

This document provides a current status update and setup instructions for the **ISTE Event Registration & Payment Verification System**.

---

## 1. Current Progress & What's Working

### User Registration Flow
- **Homepage `#events` & Details Navigation**: All original chapter events are preserved with **`NOVATOS '26`** highlighted at the top (`19 SEP 2026`). Clicking `NOVATOS '26` takes users to `/events/novatos` and `/events/novatos/register`.
- **Form Validation & Visual Polish**: Client-side validation for Name, Email, 10-digit Indian Phone format, College/Department, and Year of Study. Clean vertical field spacing, inner padding, and active focus rings.
- **Part 2 Success Confirmation Screen**: Shows a checkmark icon, `"You're registered!"` heading, student email, and a unique server-generated `registrationId` (UUID).
- **Part 3 UPI Payment & UTR Submission**: Renders a placeholder QR code, payment fee (`₹100`), registration reference ID, and an `"I've completed payment"` button that accepts a 12-digit UTR transaction number.
- **Live Google Sheets API Integration**: `appendRegistrationRow()` appends student details to the `"Registrations"` sheet tab, and `updatePaymentReference()` updates candidate `PaymentStatus` to `"Awaiting Verification"` in Google Sheets.
- **Self-Service Lookup**: Students can look up their existing registration ID and payment status at any time via `/api/register/lookup`.

### Admin Verification Portal
- **Protected Portal (`/admin/dashboard`)**: Gated by Next.js `proxy.ts` edge proxy and Supabase Auth session checks. Allowed emails are filtered via `ADMIN_EMAILS`.
- **Verification & CSV Export**: Real-time client-side search across Name, Email, Event, and UTR. One-click payment verification (`"Confirmed"`) and CSV export.

---

## 2. Required Environment Variables (.env.local)

Do **NOT** commit real credentials to git. Each developer must create a local `.env.local` file in the project root containing the following variable names:

```env
# ── Google Sheets API Service Account ──────────────────────────────────────────
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@your-gcp-project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID="your-google-spreadsheet-id"

# ── UPI Payment Credentials ───────────────────────────────────────────────────
UPI_ID="istembcet@upi"
UPI_PAYEE_NAME="ISTE SC MBCET"

# ── Admin Portal Access Allow-List (Comma-separated emails) ───────────────────
ADMIN_EMAILS="admin@iste.org,anandu@example.com"

# ── Supabase Auth Credentials ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 3. Team Access & Google Cloud Setup for Co-Heads

1. **Google Cloud Project**:
   - The current production service account is `iste-sheets-writer@iste-events.iam.gserviceaccount.com` under the `iste-events` Google Cloud project.
   - Please ensure all co-heads/co-leads are added as **IAM Members / Editors** on the `iste-events` Google Cloud project so anyone on the team can manage or regenerate service account keys if needed.
2. **Google Sheet Access**:
   - Ask Anandu for the direct Google Sheet URL link.
   - Ensure your service account email address (`client_email`) is granted **Editor** permissions on the target Google Sheet, and that the first tab is named **`Registrations`**.

---

## 4. How to Run Locally

```bash
git checkout feature/event-registration
npm install
npm run dev
```
Open `http://localhost:3000` to test the website locally.
