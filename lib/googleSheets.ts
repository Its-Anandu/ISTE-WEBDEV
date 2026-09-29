import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export interface RegistrationData {
  timestamp?: string;
  registrationId?: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  yearOfStudy: string;
  classGroup: string;
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
  const targetId = item.registrationId || item.email;
  const existingIdx = list.findIndex((r) => (r.registrationId || r.email) === targetId);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...item };
  } else {
    list.unshift(item);
  }
  writeLocalRegistrations(list);
}

/**
 * Standard column headers array for Google Sheets (A1:L1)
 */
const EXPECTED_HEADERS = [
  'Timestamp',
  'EventID',
  'FullName',
  'Email',
  'Phone',
  'College',
  'Department',
  'Year',
  'Class',
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
 * Ensures header row A1:L1 in Google Sheets matches EXPECTED_HEADERS.
 */
async function ensureSheetHeaders(sheets: any, spreadsheetId: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A1:L1',
    });
    const firstRow = res.data.values?.[0] || [];
    const isMatching = EXPECTED_HEADERS.every((h, i) => (firstRow[i] || '').trim() === h);

    if (!isMatching) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Registrations!A1:L1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [EXPECTED_HEADERS],
        },
      });
      console.log('[Google Sheets] Updated sheet A1:L1 headers to standard layout.');
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
      range: 'Registrations!A:L',
    });

    const rows = response.data.values || [];
    if (rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        // Col B (index 1) = EventID, Col D (index 3) = Email
        const rowEventId = (rows[i][1] || '').trim().toLowerCase();
        const rowEmail = (rows[i][3] || '').trim().toLowerCase();

        if (rowEventId === normalizedEventId && rowEmail === normalizedEmail) {
          return {
            isDuplicate: true,
            registrationId: rows[i][11] || rows[i][1] || '',
            fullName: rows[i][2] || '',
            paymentStatus: rows[i][10] || 'Pending',
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
      registrationId: found.registrationId || found.paymentRef,
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
    paymentStatus: data.paymentStatus || 'Incomplete',
    paymentRef: data.paymentRef || data.registrationId || '',
  };

  // Always save to local backup as well
  saveToLocal(rowItem);

  // Exact column alignment matching EXPECTED_HEADERS A:L:
  // A: Timestamp, B: EventID, C: FullName, D: Email, E: Phone, F: College, G: Department, H: Year, I: Class, J: ISTEMembershipID, K: PaymentStatus, L: PaymentRef
  const rowValues = [
    timestamp,
    rowItem.eventId,
    rowItem.fullName,
    rowItem.email,
    rowItem.phone,
    rowItem.college,
    rowItem.department,
    rowItem.yearOfStudy,
    rowItem.classGroup,
    rowItem.isteId || '',
    rowItem.paymentStatus,
    rowItem.paymentRef,
  ];

  const range = 'Registrations!A:L';
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
    console.log(`[Google Sheets] Successfully appended row for ${rowItem.email} to spreadsheet ${spreadsheetId}`);
  } catch (error: any) {
    console.error('SHEETS WRITE ERROR:', error?.stack || error);
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
  utrNumber: string,
  status: string = 'Completed'
): Promise<boolean> {
  let updatedLocal = false;

  const localList = readLocalRegistrations();
  const item = localList.find((r) => r.registrationId === registrationId || r.email === registrationId);
  if (item) {
    item.paymentStatus = status;
    item.paymentRef = utrNumber;
    writeLocalRegistrations(localList);
    updatedLocal = true;
  }

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:L',
    });

    const rows = response.data.values || [];
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      // Col L (index 11) = PaymentRef / Registration ID, or Col D (index 3) = Email
      if (rows[i][11] === registrationId || rows[i][3] === registrationId) {
        targetRowIndex = i + 1; // 1-based row index
        break;
      }
    }

    if (targetRowIndex !== -1) {
      // Col K (index 10) = PaymentStatus, Col L (index 11) = PaymentRef
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Registrations!K${targetRowIndex}:L${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[status, utrNumber]],
        },
      });
      console.log(`[Google Sheets] Updated PaymentStatus to ${status} for ${registrationId}`);
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
      range: 'Registrations!A:L',
    });

    const rows = response.data.values || [];
    if (rows.length > 1) {
      return rows.slice(1).map((row) => ({
        timestamp: row[0] || '',
        eventId: row[1] || '',
        fullName: row[2] || '',
        email: row[3] || '',
        phone: row[4] || '',
        college: row[5] || '',
        department: row[6] || '',
        yearOfStudy: row[7] || '',
        classGroup: row[8] || '',
        isteId: row[9] || '',
        paymentStatus: row[10] || 'Pending',
        paymentRef: row[11] || '',
        registrationId: row[11] || '',
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
  const item = localList.find((r) => r.registrationId === registrationId || r.email === registrationId);
  if (item) {
    item.paymentStatus = 'Confirmed';
    writeLocalRegistrations(localList);
    updatedLocal = true;
  }

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:L',
    });

    const rows = response.data.values || [];
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][11] === registrationId || rows[i][3] === registrationId) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex !== -1) {
      // Col K (index 10) = PaymentStatus
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Registrations!K${targetRowIndex}`,
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
