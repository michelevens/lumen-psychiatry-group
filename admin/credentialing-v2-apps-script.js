/**
 * EnnHealth Credentialing Ops v2 — Google Apps Script Backend
 *
 * Multi-tab CRUD backend for the V2 credentialing platform.
 * Lives in the SAME Google Sheet as the V1 license tracker (Sheet1).
 * V2 data uses prefixed tabs: v2_organizations, v2_providers, etc.
 *
 * SETUP:
 * 1. Open the existing EnnHealth License Tracker Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Create a new script file (e.g. "V2Backend.gs")
 * 4. Paste this entire script
 * 5. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web app URL
 * 7. Paste into credentialing-ops-v2/core/store.js CONFIG.APPS_SCRIPT_URL
 *
 * NOTE: If deploying alongside V1, create a SEPARATE deployment
 * (V1 and V2 can coexist in the same Apps Script project).
 */

// ─── Sheet Tab Configs ───
// Column order per V2 tab. "id" is always first.

var SHEET_CONFIGS = {
  v2_organizations: ['id', 'name', 'npi', 'taxId', 'address', 'phone', 'email', 'taxonomy', 'createdAt', 'updatedAt'],
  v2_providers: ['id', 'orgId', 'firstName', 'lastName', 'credentials', 'npi', 'taxonomy', 'specialty', 'email', 'phone', 'active', 'createdAt', 'updatedAt'],
  v2_licenses: ['id', 'providerId', 'providerName', 'npi', 'state', 'licenseNumber', 'licenseType', 'status', 'issueDate', 'expirationDate', 'renewalDate', 'compactState', 'notes', 'createdAt', 'updatedAt'],
  v2_applications: ['id', 'providerId', 'orgId', 'payerId', 'planId', 'state', 'type', 'wave', 'status', 'portalUrl', 'applicationRef', 'enrollmentId', 'submittedDate', 'receivedDate', 'effectiveDate', 'denialReason', 'estMonthlyRevenue', 'payerContactName', 'payerContactPhone', 'payerContactEmail', 'notes', 'tags', 'createdAt', 'updatedAt'],
  v2_followups: ['id', 'applicationId', 'type', 'dueDate', 'completedDate', 'method', 'contactName', 'contactPhone', 'contactEmail', 'outcome', 'nextAction', 'createdAt', 'updatedAt'],
  v2_strategy_profiles: ['id', 'name', 'description', 'targetStates', 'waveRules', 'revenueThreshold', 'autoWaveAssignment', 'createdAt', 'updatedAt'],
  v2_payers: ['id', 'name', 'category', 'region', 'parentOrg', 'stediId', 'states', 'credentialingUrl', 'avgCredDays', 'notes'],
  v2_payer_plans: ['id', 'payerId', 'name', 'type', 'state', 'reimbursementRate', 'notes'],
  v2_activity_logs: ['id', 'applicationId', 'type', 'date', 'contactName', 'contactPhone', 'refNumber', 'outcome', 'nextStep', 'statusFrom', 'statusTo', 'createdBy', 'createdAt'],
  v2_telehealth_policies: ['id', 'state', 'practiceAuthority', 'cpaNotes', 'telehealthParity', 'controlledSubstances', 'csNotes', 'consentRequired', 'consentNotes', 'inPersonRequired', 'inPersonNotes', 'originatingSite', 'aprnCompact', 'nlcMember', 'medicaidTelehealth', 'medicaidNotes', 'audioOnly', 'crossStateLicense', 'ryanHaightExemption', 'lastUpdated', 'notes', 'readinessScore', 'createdAt', 'updatedAt'],
  v2_tasks: ['id', 'title', 'category', 'priority', 'dueDate', 'linkedAppId', 'recurrence', 'notes', 'completed', 'completedAt', 'createdAt', 'updatedAt'],
};

// Collection name → sheet tab name mapping
var COLLECTION_MAP = {
  organizations: 'v2_organizations',
  providers: 'v2_providers',
  licenses: 'v2_licenses',
  applications: 'v2_applications',
  followups: 'v2_followups',
  strategy_profiles: 'v2_strategy_profiles',
  payers: 'v2_payers',
  payer_plans: 'v2_payer_plans',
  activity_logs: 'v2_activity_logs',
  telehealth_policies: 'v2_telehealth_policies',
  tasks: 'v2_tasks',
};

// Fields that store JSON (arrays/objects)
var JSON_FIELDS = ['address', 'states', 'tags', 'targetStates', 'waveRules'];

// JSON fields that default to {} instead of []
var JSON_OBJECT_FIELDS = ['address'];

// Fields that store booleans
var BOOLEAN_FIELDS = ['active', 'compactState', 'autoWaveAssignment', 'telehealthParity', 'inPersonRequired', 'aprnCompact', 'nlcMember', 'audioOnly', 'ryanHaightExemption', 'completed'];

// Fields that store numbers
var NUMBER_FIELDS = ['wave', 'avgCredDays', 'reimbursementRate', 'estMonthlyRevenue', 'revenueThreshold', 'readinessScore'];


// ─── GET Handler ───

function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) || 'getAllCollections';

    if (action === 'getAllCollections') {
      return jsonResponse({ success: true, data: getAllCollections() });
    }

    if (action === 'getAll') {
      var collection = e.parameter.collection;
      if (!collection || !COLLECTION_MAP[collection]) {
        return jsonResponse({ success: false, error: 'Invalid collection: ' + collection });
      }
      var sheetName = COLLECTION_MAP[collection];
      return jsonResponse({ success: true, data: getSheetRows(sheetName) });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}


// ─── POST Handler ───

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    // bulkReplace: replace ALL data in a collection
    if (action === 'bulkReplace') {
      var collection = body.collection;
      if (!collection || !COLLECTION_MAP[collection]) {
        return jsonResponse({ success: false, error: 'Invalid collection: ' + collection });
      }
      var sheetName = COLLECTION_MAP[collection];
      var sheet = getOrCreateSheet(sheetName);
      var cols = SHEET_CONFIGS[sheetName];

      // Clear existing data (keep header)
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, cols.length).clearContent();
      }

      // Write new data
      var entries = body.entries || [];
      if (entries.length > 0) {
        var rows = entries.map(function(entry) {
          return cols.map(function(col) { return serializeValue(col, entry[col]); });
        });
        sheet.getRange(2, 1, rows.length, cols.length).setValues(rows);
      }

      return jsonResponse({ success: true, count: entries.length });
    }

    // bulkSync: replace multiple collections at once
    if (action === 'bulkSync') {
      var collections = body.collections || {};
      var results = {};

      for (var collectionName in collections) {
        if (!COLLECTION_MAP[collectionName]) continue;
        var sheetName2 = COLLECTION_MAP[collectionName];
        var sheet2 = getOrCreateSheet(sheetName2);
        var cols2 = SHEET_CONFIGS[sheetName2];

        // Clear existing data
        var lastRow2 = sheet2.getLastRow();
        if (lastRow2 > 1) {
          sheet2.getRange(2, 1, lastRow2 - 1, cols2.length).clearContent();
        }

        // Write new data
        var entries2 = collections[collectionName] || [];
        if (entries2.length > 0) {
          var rows2 = entries2.map(function(entry) {
            return cols2.map(function(col) { return serializeValue(col, entry[col]); });
          });
          sheet2.getRange(2, 1, rows2.length, cols2.length).setValues(rows2);
        }

        results[collectionName] = entries2.length;
      }

      return jsonResponse({ success: true, results: results });
    }

    // add: append a single row
    if (action === 'add') {
      var collection3 = body.collection;
      if (!collection3 || !COLLECTION_MAP[collection3]) {
        return jsonResponse({ success: false, error: 'Invalid collection: ' + collection3 });
      }
      var sheetName3 = COLLECTION_MAP[collection3];
      var sheet3 = getOrCreateSheet(sheetName3);
      var cols3 = SHEET_CONFIGS[sheetName3];
      var entry3 = body.entry;
      var row3 = cols3.map(function(col) { return serializeValue(col, entry3[col]); });
      sheet3.appendRow(row3);
      return jsonResponse({ success: true });
    }

    // update: find by id and update in place
    if (action === 'update') {
      var collection4 = body.collection;
      if (!collection4 || !COLLECTION_MAP[collection4]) {
        return jsonResponse({ success: false, error: 'Invalid collection: ' + collection4 });
      }
      var sheetName4 = COLLECTION_MAP[collection4];
      var sheet4 = getOrCreateSheet(sheetName4);
      var cols4 = SHEET_CONFIGS[sheetName4];
      var entry4 = body.entry;
      var id4 = entry4.id;

      var lastRow4 = sheet4.getLastRow();
      if (lastRow4 > 1) {
        var ids4 = sheet4.getRange(2, 1, lastRow4 - 1, 1).getValues();
        for (var i4 = 0; i4 < ids4.length; i4++) {
          if (ids4[i4][0] === id4) {
            var row4 = cols4.map(function(col) { return serializeValue(col, entry4[col]); });
            sheet4.getRange(i4 + 2, 1, 1, cols4.length).setValues([row4]);
            return jsonResponse({ success: true });
          }
        }
      }
      // Not found — append
      var rowNew = cols4.map(function(col) { return serializeValue(col, entry4[col]); });
      sheet4.appendRow(rowNew);
      return jsonResponse({ success: true });
    }

    // delete: find by id and remove row
    if (action === 'delete') {
      var collection5 = body.collection;
      if (!collection5 || !COLLECTION_MAP[collection5]) {
        return jsonResponse({ success: false, error: 'Invalid collection: ' + collection5 });
      }
      var sheetName5 = COLLECTION_MAP[collection5];
      var sheet5 = getOrCreateSheet(sheetName5);
      var id5 = body.id;

      var lastRow5 = sheet5.getLastRow();
      if (lastRow5 > 1) {
        var ids5 = sheet5.getRange(2, 1, lastRow5 - 1, 1).getValues();
        for (var i5 = ids5.length - 1; i5 >= 0; i5--) {
          if (ids5[i5][0] === id5) {
            sheet5.deleteRow(i5 + 2);
            return jsonResponse({ success: true });
          }
        }
      }
      return jsonResponse({ success: false, error: 'Record not found: ' + id5 });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}


// ─── Helpers ───

function getAllCollections() {
  var result = {};
  for (var collection in COLLECTION_MAP) {
    var sheetName = COLLECTION_MAP[collection];
    result[collection] = getSheetRows(sheetName);
  }
  return result;
}

function getSheetRows(sheetName) {
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var cols = SHEET_CONFIGS[sheetName];
  var data = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();

  return data
    .filter(function(row) { return row[0] !== ''; })
    .map(function(row) {
      var obj = {};
      cols.forEach(function(col, i) {
        obj[col] = deserializeValue(col, row[i]);
      });
      return obj;
    });
}

function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var cols = SHEET_CONFIGS[sheetName];
    if (cols) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      // Bold header row
      sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold');
      // Freeze header
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

function serializeValue(colName, value) {
  if (value === undefined || value === null) return '';
  if (JSON_FIELDS.indexOf(colName) !== -1) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  if (BOOLEAN_FIELDS.indexOf(colName) !== -1) {
    return value === true || value === 'true' ? 'TRUE' : 'FALSE';
  }
  if (NUMBER_FIELDS.indexOf(colName) !== -1) {
    return value === '' ? '' : Number(value) || 0;
  }
  return String(value);
}

function deserializeValue(colName, value) {
  if (value === '' || value === null || value === undefined) {
    if (JSON_FIELDS.indexOf(colName) !== -1) return JSON_OBJECT_FIELDS.indexOf(colName) !== -1 ? {} : [];
    if (BOOLEAN_FIELDS.indexOf(colName) !== -1) return false;
    if (NUMBER_FIELDS.indexOf(colName) !== -1) return 0;
    return '';
  }

  if (JSON_FIELDS.indexOf(colName) !== -1) {
    try { return JSON.parse(value); } catch (e) { return value; }
  }
  if (BOOLEAN_FIELDS.indexOf(colName) !== -1) {
    return value === true || value === 'TRUE' || value === 'true';
  }
  if (NUMBER_FIELDS.indexOf(colName) !== -1) {
    return Number(value) || 0;
  }
  return String(value);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
