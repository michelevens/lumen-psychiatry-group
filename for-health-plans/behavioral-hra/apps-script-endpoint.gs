/**
 * EnnHealth — Behavioral HRA Partner Inquiry Endpoint
 *
 * Receives form submissions from ennhealth.com/for-health-plans/behavioral-hra/
 * and writes them to a Google Sheet + sends an email notification.
 *
 * SEPARATE from the main booking script because:
 *   - Different audience (health plans, not patients)
 *   - Different access (partnerships team, not clinical staff)
 *   - No PHI in these records — safe to share more broadly
 *
 * SETUP (one-time, ~10 minutes):
 *   1. Create Google Sheet named "EnnHealth Partner Inquiries"
 *      Header row (A1:K1):
 *      Timestamp | Name | Title | Org | Email | Lives | Model | Notes | Source | UA | IP
 *   2. Go to https://script.google.com → New project → name it "EnnHealth Partnerships"
 *   3. Paste ALL of this code, replace SHEET_ID and NOTIFY_EMAIL below
 *   4. Deploy → New deployment → Type: Web app
 *         Execute as: Me
 *         Who has access: Anyone
 *      Copy the /exec URL
 *   5. Paste URL into for-health-plans/behavioral-hra/index.html
 *      (replace REPLACE_WITH_APPS_SCRIPT_URL)
 *   6. Test: submit the form, confirm row appears in sheet + email arrives
 */

// ─── CONFIG — edit these ───
var SHEET_ID     = '1LBMLfPNawau7a8UZWefM4PGbunPlD39sISjqMx5uohE'; // from the sheet URL between /d/ and /edit
var SHEET_TAB    = 'Inquiries';                  // tab name inside the sheet
var NOTIFY_EMAIL = 'partnerships@ennhealth.com'; // where new-lead alerts go
var BACKUP_EMAIL = 'contact@ennhealth.com';      // cc in case partnerships@ isn't set up yet

// ─── Security: escape for email HTML ───
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Basic spam guard ───
function isSpam(data) {
  if (!data) return true;
  if (!data.name || !data.email || !data.org) return true;
  if (String(data.email).indexOf('@') === -1) return true;
  // Obvious honeypot / junk
  if (String(data.name).length > 200) return true;
  if (String(data.notes || '').length > 5000) return true;
  // Free-email heuristic (soft flag — don't reject, just note)
  return false;
}

function isFreeEmail(email) {
  var free = ['gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com','proton.me','protonmail.com'];
  var domain = String(email || '').split('@')[1] || '';
  return free.indexOf(domain.toLowerCase()) !== -1;
}

// ─── POST handler ───
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (isSpam(data)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'invalid' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var timestamp = new Date();
    var row = [
      timestamp,
      data.name || '',
      data.title || '',
      data.org || '',
      data.email || '',
      data.lives || '',
      data.model || '',
      data.notes || '',
      data.source || 'behavioral-hra-landing',
      (e.parameter && e.parameter.userAgent) || '',
      '' // IP not available in Apps Script — leave blank
    ];

    // Append to sheet
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB);
    if (!sheet) throw new Error('Sheet tab "' + SHEET_TAB + '" not found');
    sheet.appendRow(row);

    // Notify partnerships team
    sendNotificationEmail(data, timestamp);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('doPost error:', err);
    // Try to email the error so we don't lose the lead
    try {
      MailApp.sendEmail(BACKUP_EMAIL, 'EnnHealth partner form ERROR',
        'Error: ' + err.message + '\n\nRaw payload:\n' + (e.postData ? e.postData.contents : 'none'));
    } catch (_) {}
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'server' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── GET handler (health check) ───
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, endpoint: 'partner-inquiry', version: 1 }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Email notification ───
function sendNotificationEmail(data, ts) {
  var subject = '[Partner Inquiry] ' + (data.org || 'Unknown') + ' — ' + (data.lives || 'lives n/a');
  var freeFlag = isFreeEmail(data.email)
    ? '<p style="background:#fef3c7;border:1px solid #f59e0b;padding:8px 12px;border-radius:6px;color:#78350f;font-size:13px;"><strong>Heads up:</strong> submitted with a personal email domain. May still be legit; verify identity on call.</p>'
    : '';

  var html = '' +
    '<div style="font-family:Inter,Arial,sans-serif;max-width:600px;color:#1e293b;">' +
    '<h2 style="color:#2C4A5A;margin-bottom:4px;">New health plan partnership inquiry</h2>' +
    '<p style="color:#64748b;font-size:13px;margin-top:0;">' + esc(Utilities.formatDate(ts, 'America/New_York', 'yyyy-MM-dd HH:mm z')) + '</p>' +
    freeFlag +
    '<table style="border-collapse:collapse;width:100%;margin-top:16px;">' +
    row('Name', data.name) +
    row('Title', data.title) +
    row('Organization', data.org) +
    row('Email', '<a href="mailto:' + esc(data.email) + '">' + esc(data.email) + '</a>') +
    row('MA lives', data.lives) +
    row('Model interest', data.model) +
    row('Notes', (data.notes || '').replace(/\n/g, '<br>')) +
    row('Source', data.source || 'behavioral-hra-landing') +
    '</table>' +
    '<p style="margin-top:24px;font-size:13px;color:#64748b;">' +
    'Follow up within <strong>2 business days</strong> per the page promise. ' +
    'Log the outreach in the Partner Inquiries sheet.</p>' +
    '</div>';

  var to = NOTIFY_EMAIL;
  var cc = (NOTIFY_EMAIL !== BACKUP_EMAIL) ? BACKUP_EMAIL : null;

  MailApp.sendEmail({
    to: to,
    cc: cc || undefined,
    subject: subject,
    htmlBody: html,
    replyTo: data.email || BACKUP_EMAIL,
    name: 'EnnHealth Partnerships'
  });
}

function row(label, val) {
  return '<tr>' +
    '<td style="padding:8px 12px;background:#f8fafb;border:1px solid #e2e8f0;font-weight:600;width:140px;color:#2C4A5A;">' + esc(label) + '</td>' +
    '<td style="padding:8px 12px;border:1px solid #e2e8f0;">' + (val || '<em style="color:#94a3b8;">(not provided)</em>') + '</td>' +
    '</tr>';
}
