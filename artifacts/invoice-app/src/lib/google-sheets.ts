/**
 * Google Sheets sync — uses the OAuth access token obtained when the user
 * signs in with Google (Supabase stores it as session.provider_token).
 *
 * The token already has the spreadsheets + drive.file scopes because we
 * request them in signInWithGoogle().
 */

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SHEET_ID_KEY = "ats_google_sheet_id";

interface SyncData {
  profile: Record<string, string>;
  clients: Record<string, string>[];
  invoices: Record<string, string>[];
}

/** GET or create the user's backup spreadsheet, return its id + url. */
async function getOrCreateSpreadsheet(token: string): Promise<{ id: string; url: string }> {
  const saved = localStorage.getItem(SHEET_ID_KEY);

  if (saved) {
    // Verify it still exists
    const check = await fetch(`${SHEETS_API}/${saved}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (check.ok) {
      return { id: saved, url: `https://docs.google.com/spreadsheets/d/${saved}` };
    }
    // Sheet was deleted — recreate it
    localStorage.removeItem(SHEET_ID_KEY);
  }

  // Create new spreadsheet
  const res = await fetch(SHEETS_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { title: "Awais Tech Services — Invoice Backup" },
      sheets: [
        { properties: { title: "Invoices", sheetId: 0 } },
        { properties: { title: "Clients",  sheetId: 1 } },
        { properties: { title: "Profile",  sheetId: 2 } },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to create Google Sheet");
  }

  const data = await res.json();
  const id: string = data.spreadsheetId;
  localStorage.setItem(SHEET_ID_KEY, id);
  return { id, url: data.spreadsheetUrl };
}

/** Write rows to a named sheet tab, replacing any existing content. */
async function writeSheet(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rows: (string | number)[][]
) {
  const range = `${sheetName}!A1`;
  await fetch(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range, majorDimension: "ROWS", values: rows }),
  });
}

/** Style the header row bold + coloured for a sheet by its 0-based sheetId. */
async function styleHeader(token: string, spreadsheetId: string, sheetId: number) {
  await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.051, green: 0.106, blue: 0.165 }, // #0d1b2a navy
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      }],
    }),
  });
}

/** Main entry: sync all data to Google Sheets and return the sheet URL. */
export async function syncToGoogleSheets(token: string, data: SyncData): Promise<string> {
  const { id, url } = await getOrCreateSpreadsheet(token);

  // --- Invoices ---
  const invHeaders = ["Invoice #", "Client", "Status", "Issue Date", "Due Date", "Subtotal", "Discount", "Tax", "Total", "Notes"];
  const invRows: (string | number)[][] = [invHeaders, ...data.invoices.map(inv => [
    inv["Invoice #"] ?? "",
    inv["Client"] ?? "",
    inv["Status"] ?? "",
    inv["Issue Date"] ?? "",
    inv["Due Date"] ?? "",
    inv["Subtotal ($)"] ?? "",
    inv["Discount ($)"] ?? "",
    inv["Tax ($)"] ?? "",
    inv["Total ($)"] ?? "",
    inv["Notes"] ?? "",
  ])];
  await writeSheet(token, id, "Invoices", invRows);

  // --- Clients ---
  const clientHeaders = ["Name", "Company", "Email", "Phone", "Address", "ABN", "Notes"];
  const clientRows: (string | number)[][] = [clientHeaders, ...data.clients.map(c => [
    c["Name"] ?? "",
    c["Company"] ?? "",
    c["Email"] ?? "",
    c["Phone"] ?? "",
    c["Address"] ?? "",
    c["ABN"] ?? "",
    c["Notes"] ?? "",
  ])];
  await writeSheet(token, id, "Clients", clientRows);

  // --- Profile ---
  const profileRows: (string | number)[][] = [
    ["Field", "Value"],
    ...Object.entries(data.profile).map(([k, v]) => [k, v]),
  ];
  await writeSheet(token, id, "Profile", profileRows);

  // Style headers (fire-and-forget, non-critical)
  await Promise.allSettled([
    styleHeader(token, id, 0),
    styleHeader(token, id, 1),
    styleHeader(token, id, 2),
  ]);

  return url;
}

export function getSavedSheetUrl(): string | null {
  const id = localStorage.getItem(SHEET_ID_KEY);
  return id ? `https://docs.google.com/spreadsheets/d/${id}` : null;
}
