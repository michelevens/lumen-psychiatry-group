// EnnHealth License Tracker — Google Apps Script Backend
// =====================================================
// SETUP:
// 1. Create a new Google Sheet named "EnnHealth License Tracker"
// 2. Add these headers in Row 1:
//    abbr | name | status | license_type | license_number | issued | expiration | in_nursys | ceu_required | ceu_completed | notes
// 3. Go to Extensions > Apps Script
// 4. Paste this entire script
// 5. Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the Web app URL
// 7. Paste into license-tracker.html CONFIG.APPS_SCRIPT_URL
// 8. Paste into index.html LICENSE_API variable (for dynamic landing page)

const SHEET_NAME = 'Sheet1';
const COLUMNS = ['abbr', 'name', 'status', 'license_type', 'license_number', 'issued', 'expiration', 'in_nursys', 'ceu_required', 'ceu_completed', 'notes'];

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'getAll';

  if (action === 'getAll') {
    return jsonResponse({ success: true, data: getAllRows() });
  }

  // Public endpoint: returns only active/pending states (for landing page)
  if (action === 'getPublic') {
    const all = getAllRows();
    const pub = all.filter(function(r) { return r.status === 'active' || r.status === 'pending'; });
    return jsonResponse({ success: true, data: pub });
  }

  return jsonResponse({ success: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    // bulkReplace: replace ALL data (used by Save All)
    if (action === 'bulkReplace') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).clearContent();
      }
      const entries = body.entries || [];
      entries.forEach(function(entry) { addRow(entry); });
      return jsonResponse({ success: true, data: getAllRows() });
    }

    // Single add
    if (action === 'add') {
      addRow(body.entry);
      return jsonResponse({ success: true, data: getAllRows() });
    }

    // Single update
    if (action === 'update') {
      updateRow(body.entry);
      return jsonResponse({ success: true, data: getAllRows() });
    }

    // Delete
    if (action === 'delete') {
      deleteRow(body.entry.abbr);
      return jsonResponse({ success: true, data: getAllRows() });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function getAllRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
  return data
    .filter(function(row) { return row[0] !== ''; })
    .map(function(row) {
      var obj = {};
      COLUMNS.forEach(function(col, i) {
        obj[col] = row[i] !== '' ? String(row[i]) : '';
      });
      return obj;
    });
}

function addRow(entry) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const row = COLUMNS.map(function(col) { return entry[col] || ''; });
  sheet.appendRow(row);
}

function updateRow(entry) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === entry.abbr) {
      const row = COLUMNS.map(function(col) { return entry[col] || ''; });
      sheet.getRange(i + 2, 1, 1, COLUMNS.length).setValues([row]);
      return;
    }
  }
  // Not found — add it
  addRow(entry);
}

function deleteRow(abbr) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === abbr) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
