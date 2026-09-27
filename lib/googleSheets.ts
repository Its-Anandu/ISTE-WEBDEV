import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export interface RegistrationData {
  timestamp?: string;
  registrationId: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  yearOfStudy: string;
  isteId?: string;
  paymentStatus?: string;
  paymentRef?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  registrationId?: string;
  paymentStatus?: string;
  fullName?: string;
}

// Local JSON storage backup
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'registrations.json');

function ensureLocalDataFile() {
  const dir = path.dirname(LOCAL_DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([]), 'utf-8');
  }
}

function readLocalRegistrations(): RegistrationData[] {
  ensureLocalDataFile();
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalRegistrations(data: RegistrationData[]) {
  ensureLocalDataFile();
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function saveToLocal(item: RegistrationData) {
  const list = readLocalRegistrations();
  const existingIdx = list.findIndex((r) => r.registrationId === item.registrationId);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...item };
  } else {
    list.unshift(item);
  }
  writeLocalRegistrations(list);
}

/**
 * Standard column headers array for Google Sheets (A1:K1)
 */
const EXPECTED_HEADERS = [
  'Timestamp',
  'RegistrationID',
  'EventID',
  'FullName',
  'Email',
  'Phone',
  'College',
  'Year',
  'ISTEMembershipID',
  'PaymentStatus',
  'PaymentRef',
];

/**
 * Creates an authenticated Google Sheets API client using service account JWT auth.
 */
function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKeyRaw || !spreadsheetId) {
    throw new Error(
      `Google Sheets environment variables missing (CLIENT_EMAIL: ${!!clientEmail}, PRIVATE_KEY: ${!!privateKeyRaw}, SPREADSHEET_ID: ${!!spreadsheetId})`
    );
  }

  if (privateKeyRaw.includes('...') || privateKeyRaw.length < 100) {
    throw new Error(
      'Invalid Google Sheets Private Key in .env.local: Private key is a truncated placeholder. Please paste your full Google Cloud Service Account Private Key into .env.local.'
    );
  }

  // Handle formatted and escaped newlines in private key
  const privateKey = privateKeyRaw.includes('\\n')
    ? privateKeyRaw.replace(/\\n/g, '\n')
    : privateKeyRaw;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  return { sheets, spreadsheetId };
}

/**
 * Ensures header row A1:K1 in Google Sheets matches EXPECTED_HEADERS.
 */
async function ensureSheetHeaders(sheets: any, spreadsheetId: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A1:K1',
    });
    const firstRow = res.data.values?.[0] || [];
    const isMatching = EXPECTED_HEADERS.every((h, i) => (firstRow[i] || '').trim() === h);

    if (!isMatching) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Registrations!A1:K1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [EXPECTED_HEADERS],
        },
      });
      console.log('[Google Sheets] Updated sheet A1:K1 headers to standard layout.');
    }
  } catch (err: any) {
    console.warn('[Google Sheets] Warning checking/updating headers:', err?.message || err);
  }
}

/**
 * Checks if a registration already exists for a specific eventId and email address.
 */
export async function checkDuplicateRegistration(
  eventId: string,
  email: string
): Promise<DuplicateCheckResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedEventId = eventId.trim().toLowerCase();

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:K',
    });

    const rows = response.data.values || [];
    if (rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        // Col C (index 2) = EventID, Col E (index 4) = Email
        const rowEventId = (rows[i][2] || '').trim().toLowerCase();
        const rowEmail = (rows[i][4] || '').trim().toLowerCase();

        if (rowEventId === normalizedEventId && rowEmail === normalizedEmail) {
          return {
            isDuplicate: true,
            registrationId: rows[i][1] || '',
            fullName: rows[i][3] || '',
            paymentStatus: rows[i][9] || 'Pending',
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[checkDuplicateRegistration Google API Notice — Using local fallback]:', err?.message || err);
  }

  // Check local fallback
  const localList = readLocalRegistrations();
  const found = localList.find(
    (r) => r.eventId.toLowerCase() === normalizedEventId && r.email.toLowerCase() === normalizedEmail
  );

  if (found) {
    return {
      isDuplicate: true,
      registrationId: found.registrationId,
      fullName: found.fullName,
      paymentStatus: found.paymentStatus || 'Pending',
    };
  }

  return { isDuplicate: false };
}

/**
 * Appends a new event registration row to the Google Sheet tab "Registrations".
 */
export async function appendRegistrationRow(data: RegistrationData): Promise<void> {
  const timestamp = data.timestamp || new Date().toISOString();
  const rowItem: RegistrationData = {
    ...data,
    timestamp,
    paymentStatus: data.paymentStatus || 'Pending',
    paymentRef: data.paymentRef || '',
  };

  // Always save to local backup as well
  saveToLocal(rowItem);

  // Exact column alignment matching headers:
  // A: Timestamp, B: RegistrationID, C: EventID, D: FullName, E: Email, F: Phone, G: College, H: Year, I: ISTEMembershipID, J: PaymentStatus, K: PaymentRef
  const rowValues = [
    timestamp,
    rowItem.registrationId,
    rowItem.eventId,
    rowItem.fullName,
    rowItem.email,
    rowItem.phone,
    rowItem.college,
    rowItem.yearOfStudy,
    rowItem.isteId || '',
    rowItem.paymentStatus,
    rowItem.paymentRef,
  ];

  const range = 'Registrations!A:K';
  const { sheets, spreadsheetId } = getSheetsClient();

  console.log('Writing to:', spreadsheetId, range);

  try {
    await ensureSheetHeaders(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues],
      },
    });
    console.log(`[Google Sheets] Successfully appended row for ${rowItem.registrationId} to spreadsheet ${spreadsheetId}`);
  } catch (error: any) {
    console.error('SHEETS WRITE ERROR:', JSON.stringify(error, null, 2));
    if (
      error?.message?.includes('invalid_grant') ||
      error?.message?.includes('account not found') ||
      error?.message?.includes('placeholder')
    ) {
      console.warn('[Google Sheets] Saved to local storage backup (data/registrations.json). Update GOOGLE_SHEETS_CLIENT_EMAIL in .env.local with your service account email for live cloud sync.');
      return;
    }
    throw error;
  }
}

/**
 * Finds a row by registrationId and updates PaymentStatus to "Awaiting Verification" and PaymentRef to UTR number.
 */
export async function updatePaymentReference(
  registrationId: string,
  utrNumber: string
): Promise<boolean> {
  let updatedLocal = false;

  const localList = readLocalRegistrations();
  const item = localList.find((r) => r.registrationId === registrationId);
  if (item) {
    item.paymentStatus = 'Awaiting Verification';
    item.paymentRef = utrNumber;
    writeLocalRegistrations(localList);
    updatedLocal = true;
  }

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:K',
    });

    const rows = response.data.values || [];
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      // Col B (index 1) = RegistrationID
      if (rows[i][1] === registrationId) {
        targetRowIndex = i + 1; // 1-based row index
        break;
      }
    }

    if (targetRowIndex !== -1) {
      // Col J (index 9) = PaymentStatus, Col K (index 10) = PaymentRef
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Registrations!J${targetRowIndex}:K${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Awaiting Verification', utrNumber]],
        },
      });
      console.log(`[Google Sheets] Updated PaymentStatus to Awaiting Verification for ${registrationId}`);
      return true;
    }
  } catch (err: any) {
    console.warn('[updatePaymentReference Google API Warning — Using local fallback]:', err?.message || err);
  }

  return updatedLocal;
}

/**
 * Fetches all registration rows from the "Registrations" sheet tab.
 */
export async function getAllRegistrations(): Promise<RegistrationData[]> {
  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:K',
    });

    const rows = response.data.values || [];
    if (rows.length > 1) {
      return rows.slice(1).map((row) => ({
        timestamp: row[0] || '',
        registrationId: row[1] || '',
        eventId: row[2] || '',
        fullName: row[3] || '',
        email: row[4] || '',
        phone: row[5] || '',
        college: row[6] || '',
        yearOfStudy: row[7] || '',
        isteId: row[8] || '',
        paymentStatus: row[9] || 'Pending',
        paymentRef: row[10] || '',
      }));
    }
  } catch (err: any) {
    console.warn('[getAllRegistrations Google API Notice — Using local list]:', err?.message || err);
  }

  return readLocalRegistrations();
}

/**
 * Admin action: Verifies payment status for a registrationId, setting PaymentStatus to "Confirmed".
 */
export async function verifyPaymentStatus(registrationId: string): Promise<boolean> {
  let updatedLocal = false;

  const localList = readLocalRegistrations();
  const item = localList.find((r) => r.registrationId === registrationId);
  if (item) {
    item.paymentStatus = 'Confirmed';
    writeLocalRegistrations(localList);
    updatedLocal = true;
  }

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:K',
    });

    const rows = response.data.values || [];
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === registrationId) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex !== -1) {
      // Col J (index 9) = PaymentStatus
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Registrations!J${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Confirmed']],
        },
      });
      return true;
    }
  } catch (err: any) {
    console.warn('[verifyPaymentStatus Google API Warning]:', err?.message || err);
  }

  return updatedLocal;
}
