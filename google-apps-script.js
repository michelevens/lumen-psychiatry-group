/**
 * EnnHealth Psychiatry — Google Apps Script Backend (V5 — Multi-Calendar)
 *
 * This script connects your website's booking calendar to Google Calendar.
 * It handles:
 *   1. GET requests — returns busy times from ALL your Google Calendars
 *   2. POST requests — creates a calendar event when someone books
 *   3. Office hours management (admin-configurable)
 *   4. Insurance eligibility via Stedi API
 *
 * WHAT CHANGED IN V5:
 *   - getBusyTimes now checks ALL owned calendars, not just the primary one
 *   - New endpoint: ?action=getCalendars — lists all calendars (for admin)
 *   - All-day events are skipped (they don't block time slots)
 *
 * SETUP:
 *   1. Go to https://script.google.com
 *   2. Open your existing "EnnHealth Booking" project (or create new)
 *   3. Replace ALL code with this file
 *   4. Click Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy
 *   5. Open the Web App URL in browser to re-authorize calendar access
 *   6. Done! All your calendars now sync with the website.
 */

// ─── SECURITY: HTML escape to prevent injection in emails ───
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── CONFIGURATION ───
var CALENDAR_ID = 'nageleymichel@gmail.com'; // Primary calendar (bookings are created here)
var NOTIFICATION_EMAIL = 'contact@ennhealth.com';
var PRACTICE_NAME = 'EnnHealth Psychiatry';
var PROVIDER_NAME = 'Dr. Nageley Michel, DNP, PMHNP, FNP';
var ALLOWED_ADMIN_EMAIL = 'nageleymichel@gmail.com';

// ─── PAYER MAPPING (carrier name → Stedi tradingPartnerServiceId) ───
var PAYER_MAP = {
  'Aetna':                '60054',
  'BlueCross BlueShield': 'BCBSF',
  'Cigna':                '62308',
  'UnitedHealthcare':     '87726',
  'Humana':               '61101',
  'Oscar':                'OSCAR',
  'Ambetter':             'AMB01',
  'Medicare':             'CMS',
  'Tricare':              'TRIC',
  'Molina':               'MOLIN'
};

// ─── Helper: return JSON response ───
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GET: Return available/busy times + office hours ───
function doGet(e) {
  var action = e.parameter.action;

  if (action === 'availability') {
    var dateStr = e.parameter.date; // Format: YYYY-MM-DD
    var busyTimes = getBusyTimes(dateStr);
    return ContentService.createTextOutput(JSON.stringify({ busyTimes: busyTimes }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getOfficeHours') {
    var stored = getStoredOfficeHours();
    return ContentService.createTextOutput(JSON.stringify({
      hours: stored.hours,
      lastUpdated: stored.lastUpdated
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // List all calendars + which ones are selected for availability checking
  if (action === 'getCalendars') {
    var calData = listAllCalendars();
    var selected = getSelectedCalendarIds();
    calData.selectedIds = selected;
    return jsonResponse(calData);
  }

  // Public: Get approved testimonials for homepage
  if (action === 'getApprovedTestimonials') {
    return handleGetApprovedTestimonials();
  }

  // Admin: Get all testimonials (GET with idToken for CORS compatibility)
  if (action === 'getTestimonials') {
    return handleGetTestimonials({ idToken: e.parameter.idToken });
  }

  // Public: Get testimonial info by token (for review page)
  if (action === 'getTestimonialByToken') {
    return handleGetTestimonialByToken(e.parameter.token);
  }

  // Admin: Get all bookings for calendar dashboard
  if (action === 'getBookings') {
    return handleGetBookings(e.parameter.idToken);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── POST: Create a booking or update admin settings ───
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Route admin actions
    if (data.action === 'setOfficeHours') {
      return handleSetOfficeHours(data);
    }

    // Route calendar selection
    if (data.action === 'setCalendars') {
      return handleSetCalendars(data);
    }

    // Route eligibility check
    if (data.action === 'checkEligibility') {
      return handleCheckEligibility(data);
    }

    // Testimonial actions
    if (data.action === 'requestTestimonial') {
      return handleRequestTestimonial(data);
    }
    if (data.action === 'submitTestimonial') {
      return handleSubmitTestimonial(data);
    }
    if (data.action === 'reviewTestimonial') {
      return handleReviewTestimonial(data);
    }
    if (data.action === 'getTestimonials') {
      return handleGetTestimonials(data);
    }

    // Booking review (admin calendar dashboard)
    if (data.action === 'reviewBooking') {
      return handleReviewBooking(data);
    }

    // Default: booking flow
    var confirmationCode = generateConfirmationCode(data.date);
    data.confirmationCode = confirmationCode;
    var eventId = createCalendarEvent(data);
    sendPatientConfirmation(data);
    sendPracticeNotification(data);
    logBookingToSheet(data);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      eventId: eventId,
      confirmationCode: confirmationCode,
      message: 'Appointment booked successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Get stored office hours from PropertiesService ───
function getStoredOfficeHours() {
  var props = PropertiesService.getScriptProperties();
  var hoursJson = props.getProperty('OFFICE_HOURS');
  var lastUpdated = props.getProperty('OFFICE_HOURS_UPDATED');
  if (!hoursJson) return { hours: null, lastUpdated: null };
  return { hours: JSON.parse(hoursJson), lastUpdated: lastUpdated };
}

// ─── Admin: Set office hours (requires Google Sign-In) ───
function handleSetOfficeHours(data) {
  // Verify Google ID token
  var idToken = data.idToken;
  if (!idToken) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: 'Missing authentication token'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Decode JWT payload directly (no external HTTP call)
    var parts = idToken.split('.');
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());

    if (payload.email !== ALLOWED_ADMIN_EMAIL) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'Unauthorized: ' + payload.email
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (payload.exp && payload.exp * 1000 < new Date().getTime()) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'Token expired. Please sign out and sign in again.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: 'Token verification failed: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Validate hours structure
  var hours = data.hours;
  for (var d = 0; d <= 6; d++) {
    var key = String(d);
    if (hours[key] !== null && hours[key] !== undefined) {
      var start = Number(hours[key].start);
      var end = Number(hours[key].end);
      if (isNaN(start) || isNaN(end) || start >= end || start < 0 || end > 24) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false, error: 'Invalid hours for day ' + d
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  // Store in PropertiesService
  var props = PropertiesService.getScriptProperties();
  props.setProperty('OFFICE_HOURS', JSON.stringify(hours));
  props.setProperty('OFFICE_HOURS_UPDATED', new Date().toISOString());

  return ContentService.createTextOutput(JSON.stringify({
    success: true, message: 'Office hours updated successfully'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Admin: Set which calendars to check for availability ───
function handleSetCalendars(data) {
  var idToken = data.idToken;
  if (!idToken) {
    return jsonResponse({ success: false, error: 'Missing authentication token' });
  }
  try {
    var parts = idToken.split('.');
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    if (payload.email !== ALLOWED_ADMIN_EMAIL) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: 'Token verification failed' });
  }

  var ids = data.calendarIds; // array of calendar IDs to check
  if (!Array.isArray(ids)) {
    return jsonResponse({ success: false, error: 'calendarIds must be an array' });
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty('SELECTED_CALENDARS', JSON.stringify(ids));
  return jsonResponse({ success: true, message: 'Calendar selection saved', selectedIds: ids });
}

// ─── Get selected calendar IDs from PropertiesService ───
function getSelectedCalendarIds() {
  var props = PropertiesService.getScriptProperties();
  var json = props.getProperty('SELECTED_CALENDARS');
  if (!json) return null; // null means "all calendars" (default)
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// ─── Check insurance eligibility via Stedi API ───
function handleCheckEligibility(data) {
  if (!data.insurance || !data.memberId || !data.dob) {
    return jsonResponse({ success: false, error: 'Please provide insurance, member ID, and date of birth.' });
  }

  var payerId = PAYER_MAP[data.insurance];
  if (!payerId) {
    return jsonResponse({ success: false, error: 'Insurance carrier not supported for real-time verification. Please call (407) 796-2406.' });
  }

  // Rate limit: 95 checks/month (free tier is 100)
  if (!checkEligibilityRateLimit()) {
    return jsonResponse({ success: false, error: 'Our verification system has reached its monthly limit. Please call (407) 796-2406 and we\'ll verify your benefits manually.' });
  }

  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('STEDI_API_KEY');
  var npi = props.getProperty('PROVIDER_NPI');
  var orgName = props.getProperty('PROVIDER_ORG') || PRACTICE_NAME;

  if (!apiKey) {
    return jsonResponse({ success: false, error: 'Eligibility verification is temporarily unavailable. Please call (407) 796-2406.' });
  }

  var dob = data.dob.replace(/-/g, '');

  var stediPayload = {
    tradingPartnerServiceId: payerId,
    encounter: { serviceTypeCodes: ['MH'] },
    provider: { organizationName: orgName, npi: npi },
    subscriber: { memberId: data.memberId.trim(), dateOfBirth: dob }
  };
  if (data.firstName) stediPayload.subscriber.firstName = data.firstName.trim();
  if (data.lastName) stediPayload.subscriber.lastName = data.lastName.trim();

  try {
    var response = UrlFetchApp.fetch(
      'https://healthcare.us.stedi.com/2024-04-01/change/medicalnetwork/eligibility/v3',
      {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + apiKey },
        payload: JSON.stringify(stediPayload),
        muteHttpExceptions: true
      }
    );

    var statusCode = response.getResponseCode();
    var body = JSON.parse(response.getContentText());

    if (statusCode !== 200) {
      var errorMsg = body.message || body.error || 'Verification failed';
      return jsonResponse({ success: false, error: 'Unable to verify coverage: ' + errorMsg });
    }

    var result = parseEligibilityResponse(body, data.insurance);
    return jsonResponse({ success: true, eligibility: result });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Verification service temporarily unavailable. Please try again or call (407) 796-2406.' });
  }
}

// ─── Parse Stedi 271 response into simplified benefits ───
function parseEligibilityResponse(body, carrierName) {
  var result = {
    carrier: carrierName,
    planName: '',
    status: 'unknown',
    network: 'unknown',
    mentalHealth: {
      copay: null, coinsurance: null, deductible: null,
      deductibleRemaining: null, outOfPocketMax: null
    }
  };

  if (body.planInformation && body.planInformation.length > 0) {
    result.planName = body.planInformation[0].planDescription || '';
  }

  var benefits = body.benefitsInformation || [];
  for (var i = 0; i < benefits.length; i++) {
    var b = benefits[i];
    var code = b.code;
    var isInNetwork = b.inPlanNetworkIndicator === 'Y' || b.inPlanNetworkIndicator === 'yes';
    var serviceTypes = b.serviceTypeCodes || [];
    var isMH = serviceTypes.length === 0 || serviceTypes.indexOf('MH') !== -1 || serviceTypes.indexOf('30') !== -1;

    if (code === '1') {
      result.status = 'active';
      if (isInNetwork) result.network = 'in_network';
    }
    if (code === '6') result.status = 'inactive';

    if (code === 'B' && b.benefitAmount && isMH && isInNetwork) {
      result.mentalHealth.copay = parseFloat(b.benefitAmount);
    }
    if (code === 'A' && b.benefitPercent !== undefined && isMH && isInNetwork) {
      result.mentalHealth.coinsurance = Math.round(parseFloat(b.benefitPercent) * 100);
    }
    if (code === 'C' && b.benefitAmount && isInNetwork) {
      if (!result.mentalHealth.deductible || (b.coverageLevelCode === 'IND')) {
        result.mentalHealth.deductible = parseFloat(b.benefitAmount);
      }
    }
    if (code === 'G' && b.benefitAmount && isInNetwork) {
      if (!result.mentalHealth.outOfPocketMax || (b.coverageLevelCode === 'IND')) {
        result.mentalHealth.outOfPocketMax = parseFloat(b.benefitAmount);
      }
    }
  }

  return result;
}

// ─── Rate limit: track monthly eligibility checks ───
function checkEligibilityRateLimit() {
  var props = PropertiesService.getScriptProperties();
  var month = new Date().getFullYear() + '-' + (new Date().getMonth() + 1);
  var key = 'ELIG_COUNT_' + month;
  var count = parseInt(props.getProperty(key) || '0');
  if (count >= 95) return false;
  props.setProperty(key, String(count + 1));
  return true;
}

// ═══════════════════════════════════════════════════════════════
// ─── GET BUSY TIMES — NOW CHECKS ALL OWNED CALENDARS ───
// ═══════════════════════════════════════════════════════════════
// V5 FIX: Previously only checked CalendarApp.getCalendarById(CALENDAR_ID)
// which was just nageleymichel@gmail.com (primary calendar).
// Now checks ALL owned calendars so personal events, work calendar,
// and any other calendars are reflected as busy times.
function getBusyTimes(dateStr) {
  var date = new Date(dateStr + 'T00:00:00');
  var endDate = new Date(dateStr + 'T23:59:59');

  var busyTimes = [];

  // Get ALL calendars owned by this account (primary + any others)
  var calendars = CalendarApp.getAllOwnedCalendars();

  // Also include subscribed calendars (shared calendars from other people)
  var allCalendars = CalendarApp.getAllCalendars();

  // Build a Set of owned calendar IDs to avoid duplicates
  var ownedIds = {};
  for (var k = 0; k < calendars.length; k++) {
    ownedIds[calendars[k].getId()] = true;
  }

  // Add non-owned calendars (subscribed/shared) to the list
  for (var m = 0; m < allCalendars.length; m++) {
    if (!ownedIds[allCalendars[m].getId()]) {
      calendars.push(allCalendars[m]);
    }
  }

  // Filter to selected calendars only (if admin has configured a selection)
  var selectedIds = getSelectedCalendarIds();
  if (selectedIds && selectedIds.length > 0) {
    var selectedSet = {};
    for (var s = 0; s < selectedIds.length; s++) {
      selectedSet[selectedIds[s]] = true;
    }
    calendars = calendars.filter(function(cal) {
      return selectedSet[cal.getId()];
    });
  }

  for (var i = 0; i < calendars.length; i++) {
    try {
      var cal = calendars[i];
      var events = cal.getEvents(date, endDate);

      for (var j = 0; j < events.length; j++) {
        var event = events[j];

        // Skip all-day events (they don't block time slots)
        if (event.isAllDayEvent()) continue;

        var start = event.getStartTime();
        var end = event.getEndTime();

        busyTimes.push({
          start: Utilities.formatDate(start, Session.getScriptTimeZone(), 'HH:mm'),
          end: Utilities.formatDate(end, Session.getScriptTimeZone(), 'HH:mm')
        });
      }
    } catch (err) {
      // Calendar not accessible — skip silently
      Logger.log('Calendar read error for ' + calendars[i].getName() + ': ' + err);
    }
  }

  // Sort by start time
  busyTimes.sort(function(a, b) {
    return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
  });

  return busyTimes;
}

// ─── LIST ALL CALENDARS (admin endpoint to see what's being checked) ───
function listAllCalendars() {
  var allCalendars = CalendarApp.getAllCalendars();
  var defaultId = CalendarApp.getDefaultCalendar().getId();
  var list = [];

  for (var i = 0; i < allCalendars.length; i++) {
    var cal = allCalendars[i];
    list.push({
      id: cal.getId(),
      name: cal.getName(),
      primary: cal.getId() === defaultId,
      color: cal.getColor()
    });
  }

  list.sort(function(a, b) {
    if (a.primary) return -1;
    if (b.primary) return 1;
    return a.name.localeCompare(b.name);
  });

  return { calendars: list };
}

// ═══════════════════════════════════════════════════════════════
// ─── APPOINTMENT REMINDERS (time-based trigger) ───
// ═══════════════════════════════════════════════════════════════
// Run daily via a time-based trigger. Checks tomorrow's calendar events
// for appointments booked through the site and sends email reminders.
//
// SETUP: In Apps Script editor → Triggers (clock icon on left):
//   Function: sendAppointmentReminders
//   Event source: Time-driven
//   Type: Day timer
//   Time: 6pm to 7pm (sends reminders evening before)

function sendAppointmentReminders() {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) calendar = CalendarApp.getDefaultCalendar();

  // Get tomorrow's date range
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
  var tEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

  var events = calendar.getEvents(tStart, tEnd);
  var sentCount = 0;

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.isAllDayEvent()) continue;

    var desc = event.getDescription() || '';
    // Only process events booked via ennhealth.com
    if (desc.indexOf('Booked via ennhealth.com') === -1) continue;

    // Extract confirmation code from description
    var confMatch = desc.match(/Confirmation:\s*(ENH-[\w-]+)/);
    var confirmationCode = confMatch ? confMatch[1] : '';

    // Extract service type from description
    var svcMatch = desc.match(/Service:\s*(.+)/);
    var service = svcMatch ? svcMatch[1].trim() : event.getTitle();

    // Get guest emails (patient email is added as a guest if available)
    var guests = event.getGuestList();
    var patientEmail = null;

    // Check if we logged the email in event properties
    // Since we can't reliably get patient email from calendar event,
    // we look for it in the booking log sheet
    var loggedEmail = findBookingEmail(confirmationCode);
    if (loggedEmail) {
      patientEmail = loggedEmail;
    } else if (guests.length > 0) {
      patientEmail = guests[0].getEmail();
    }

    if (!patientEmail) continue; // Can't send reminder without email

    var startTime = event.getStartTime();
    var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var dateStr = startTime.toLocaleDateString('en-US', dateOptions);
    var timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Send reminder
    var subject = 'Appointment Reminder — Tomorrow at ' + timeStr + ' ET';
    var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
      '<div style="background: #2C4A5A; padding: 24px 32px; border-radius: 12px 12px 0 0;">' +
        '<h1 style="color: white; margin: 0; font-size: 20px;">' + PRACTICE_NAME + '</h1>' +
        '<p style="color: #D4A855; margin: 4px 0 0; font-size: 14px;">Appointment Reminder</p>' +
      '</div>' +
      '<div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">' +
        '<p style="font-size: 16px; color: #1e293b;">Hello,</p>' +
        '<p style="color: #64748b; line-height: 1.6;">This is a friendly reminder about your upcoming appointment tomorrow.</p>' +
        (confirmationCode ? '<div style="background: #2C4A5A; border-radius: 10px; padding: 12px 20px; margin: 20px 0; text-align: center;">' +
          '<p style="color: #b0c4ce; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>' +
          '<p style="color: #D4A855; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 2px;">' + escHtml(confirmationCode) + '</p>' +
        '</div>' : '') +
        '<div style="background: #f8fafb; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">' +
          '<table style="width: 100%; font-size: 14px;">' +
            '<tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(dateStr) + '</td></tr>' +
            '<tr><td style="padding: 6px 0; color: #64748b;">Time</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(timeStr) + ' ET</td></tr>' +
            '<tr><td style="padding: 6px 0; color: #64748b;">Service</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(service) + '</td></tr>' +
            '<tr><td style="padding: 6px 0; color: #64748b;">Provider</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(PROVIDER_NAME) + '</td></tr>' +
            '<tr><td style="padding: 6px 0; color: #64748b;">Format</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">Secure Telehealth (Video)</td></tr>' +
          '</table>' +
        '</div>' +
        '<div style="background: #faf5eb; border: 1px solid #D4A855; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">' +
          '<p style="font-weight: 700; color: #2C4A5A; margin: 0 0 6px; font-size: 14px;">Before Your Appointment</p>' +
          '<ul style="color: #64748b; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">' +
            '<li>Complete intake forms if you haven\'t already</li>' +
            '<li>Have your insurance card and photo ID ready</li>' +
            '<li>Find a quiet, private space with good internet</li>' +
            '<li>Test your camera and microphone</li>' +
          '</ul>' +
        '</div>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6;">A secure video link will be sent to you before your appointment.</p>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6;">Need to reschedule? Call <strong>(407) 796-2406</strong> or reply to this email.</p>' +
        '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">' +
        '<p style="font-size: 12px; color: #94a3b8; text-align: center;">' + PRACTICE_NAME + ' &bull; (407) 796-2406 &bull; ennhealth.com</p>' +
      '</div>' +
    '</div>';

    try {
      MailApp.sendEmail({ to: patientEmail, subject: subject, htmlBody: htmlBody });
      sentCount++;
    } catch (err) {
      Logger.log('Reminder failed for ' + confirmationCode + ': ' + err);
    }
  }

  Logger.log('Sent ' + sentCount + ' appointment reminders for ' + tStart.toDateString());
}

// ─── Look up patient email from booking log sheet ───
function findBookingEmail(confirmationCode) {
  if (!confirmationCode) return null;
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('BOOKING_LOG_SHEET_ID');
    if (!sheetId) return null;
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Bookings');
    if (!sheet) return null;
    var data = sheet.getDataRange().getValues();
    // Find row with matching confirmation code
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === confirmationCode) { // Column A = confirmation code
        return data[i][4] || null; // Column E = email
      }
    }
  } catch (e) {
    Logger.log('findBookingEmail error: ' + e);
  }
  return null;
}

// ─── Log booking to sheet for reminders + records ───
function logBookingToSheet(data) {
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('BOOKING_LOG_SHEET_ID');
    if (!sheetId) return;
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Bookings');
    if (!sheet) {
      sheet = ss.insertSheet('Bookings');
      sheet.appendRow(['Confirmation', 'Date', 'Time', 'Service', 'Email', 'Phone', 'FirstName', 'LastName', 'Insurance', 'BookedAt', 'Status']);
    }
    sheet.appendRow([
      data.confirmationCode || '',
      data.date || '',
      data.timeLabel || data.time || '',
      data.apptType || '',
      data.email || '',
      data.phone || '',
      data.firstName || '',
      data.lastName || '',
      data.insurance || '',
      new Date().toISOString(),
      'pending'
    ]);
  } catch (e) {
    Logger.log('logBookingToSheet error: ' + e);
  }
}

// ─── Generate confirmation code (ENH-YYYYMMDD-XXX) ───
function generateConfirmationCode(dateStr) {
  var datePart = dateStr.replace(/-/g, '');
  var rand = Math.floor(100 + Math.random() * 900); // 3-digit random
  return 'ENH-' + datePart + '-' + rand;
}

// ─── Create a Google Calendar event ───
function createCalendarEvent(data) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) calendar = CalendarApp.getDefaultCalendar();

  // Parse date and time
  var dateTime = new Date(data.date + 'T' + data.time + ':00');
  var endTime = new Date(dateTime.getTime() + data.duration * 60 * 1000);

  // HIPAA: Do NOT store PHI in calendar — use initials + service only
  var initials = (data.firstName ? data.firstName.charAt(0) : '') + (data.lastName ? data.lastName.charAt(0) : '');
  var title = data.apptType + ' - ' + initials.toUpperCase();
  var description = 'APPOINTMENT\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Confirmation: ' + (data.confirmationCode || 'N/A') + '\n' +
    'Service: ' + data.apptType + '\n' +
    'Duration: ' + data.duration + ' minutes\n' +
    'Format: Secure Telehealth (Video)\n\n' +
    'Patient details available in Tebra EHR.\n' +
    'Booked via ennhealth.com';

  var event = calendar.createEvent(title, dateTime, endTime, {
    description: description
  });

  // Set color (teal/blue for appointments)
  event.setColor(CalendarApp.EventColor.CYAN);

  return event.getId();
}

// ─── Send confirmation email to patient ───
function sendPatientConfirmation(data) {
  var dateObj = new Date(data.date + 'T' + data.time + ':00');
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var dateStr = dateObj.toLocaleDateString('en-US', options);

  var subject = 'Appointment Request Received - ' + PRACTICE_NAME;

  var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
    '<div style="background: #2C4A5A; padding: 24px 32px; border-radius: 12px 12px 0 0;">' +
      '<h1 style="color: white; margin: 0; font-size: 20px;">' + PRACTICE_NAME + '</h1>' +
      '<p style="color: #b0c4ce; margin: 4px 0 0; font-size: 14px;">Appointment Request Received</p>' +
    '</div>' +
    '<div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">' +
      '<p style="font-size: 16px; color: #1e293b;">Hello ' + escHtml(data.firstName) + ',</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Thank you for your interest in EnnHealth Psychiatry. We have received your appointment request.</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Our team will review your request and reach out within 1 business day to confirm your appointment or discuss next steps.</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Here are the details of your request:</p>' +
      '<div style="background: #2C4A5A; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: center;">' +
        '<p style="color: #b0c4ce; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>' +
        '<p style="color: #D4A855; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 2px;">' + escHtml(data.confirmationCode || '') + '</p>' +
      '</div>' +
      '<div style="background: #f8fafb; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">' +
        '<table style="width: 100%; font-size: 14px;">' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Service</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(data.apptType) + '</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(dateStr) + '</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Time</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(data.timeLabel) + ' ET</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Duration</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(data.duration) + ' minutes</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Provider</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(PROVIDER_NAME) + '</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Format</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">Secure Telehealth (Video)</td></tr>' +
        '</table>' +
      '</div>' +
      '<div style="background: #faf5eb; border: 1px solid #D4A855; border-radius: 10px; padding: 20px; margin: 20px 0;">' +
        '<p style="font-weight: 700; color: #2C4A5A; margin: 0 0 8px; font-size: 15px;">What Happens Next?</p>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 4px;">1. Our team will review your request within 1 business day.</p>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 4px;">2. We will contact you to confirm your appointment or discuss the best care options for your needs.</p>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">3. Once confirmed, you will receive intake forms and a secure video link for your session.</p>' +
      '</div>' +
      '<p style="color: #64748b; font-size: 14px; line-height: 1.6;">Questions? Call us at <strong>(407) 796-2406</strong> or reply to this email.</p>' +
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">' +
      '<p style="font-size: 12px; color: #94a3b8; text-align: center;">' + PRACTICE_NAME + ' &bull; 1230 Okaley Seaver Dr, Suite 101, Clermont, FL 34711 &bull; (407) 796-2406</p>' +
    '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// ═══════════════════════════════════════════════════════════════
// ─── TESTIMONIAL MANAGEMENT ───
// ═══════════════════════════════════════════════════════════════

// Get or create the Testimonials sheet
function getTestimonialSheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('BOOKING_LOG_SHEET_ID');
  if (!sheetId) return null;
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Testimonials');
  if (!sheet) {
    sheet = ss.insertSheet('Testimonials');
    sheet.appendRow(['Token', 'Email', 'PatientName', 'DisplayName', 'Rating', 'Text', 'Status', 'RequestedAt', 'SubmittedAt', 'ReviewedAt']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Generate a unique token for testimonial requests
function generateTestimonialToken() {
  return Utilities.getUuid().replace(/-/g, '');
}

// Build styled email for testimonial request
function buildTestimonialRequestEmail(patientName, token) {
  var reviewUrl = 'https://ennhealth.com/review.html?token=' + token;
  return '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
    '<div style="background: #2C4A5A; padding: 24px 32px; border-radius: 12px 12px 0 0;">' +
      '<h1 style="color: white; margin: 0; font-size: 20px;">' + PRACTICE_NAME + '</h1>' +
      '<p style="color: #D4A855; margin: 4px 0 0; font-size: 14px;">We Value Your Feedback</p>' +
    '</div>' +
    '<div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">' +
      '<p style="font-size: 16px; color: #1e293b;">Hello ' + escHtml(patientName) + ',</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Thank you for trusting ' + PRACTICE_NAME + ' with your mental health care. Your feedback helps us improve and helps others find quality care.</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Would you be willing to share a brief review of your experience? It only takes a minute.</p>' +
      '<div style="text-align: center; margin: 28px 0;">' +
        '<a href="' + reviewUrl + '" style="display: inline-block; background: #D4A855; color: #1a3545; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px;">Share Your Experience</a>' +
      '</div>' +
      '<p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">Your review will be submitted for approval before being published. You can choose a display name to protect your privacy.</p>' +
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">' +
      '<p style="font-size: 12px; color: #94a3b8; text-align: center;">' + PRACTICE_NAME + ' &bull; (407) 796-2406 &bull; ennhealth.com</p>' +
    '</div>' +
  '</div>';
}

// Verify admin auth (shared helper)
function verifyAdminToken(idToken) {
  if (!idToken) return { ok: false, error: 'Missing authentication token' };
  try {
    var parts = idToken.split('.');
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
    if (payload.email !== ALLOWED_ADMIN_EMAIL) return { ok: false, error: 'Unauthorized' };
    if (payload.exp && payload.exp * 1000 < new Date().getTime()) return { ok: false, error: 'Token expired' };
    return { ok: true, email: payload.email };
  } catch (err) {
    return { ok: false, error: 'Token verification failed' };
  }
}

// Admin: Send testimonial request email
function handleRequestTestimonial(data) {
  var auth = verifyAdminToken(data.idToken);
  if (!auth.ok) return jsonResponse({ success: false, error: auth.error });

  var email = (data.email || '').trim();
  var name = (data.patientName || '').trim();
  if (!email || !name) return jsonResponse({ success: false, error: 'Email and patient name are required' });

  var sheet = getTestimonialSheet();
  if (!sheet) return jsonResponse({ success: false, error: 'Sheet not configured. Set BOOKING_LOG_SHEET_ID in Script Properties.' });

  var token = generateTestimonialToken();
  sheet.appendRow([token, email, name, '', '', '', 'requested', new Date().toISOString(), '', '']);

  try {
    var htmlBody = buildTestimonialRequestEmail(name, token);
    MailApp.sendEmail({
      to: email,
      subject: 'Share Your Experience — ' + PRACTICE_NAME,
      htmlBody: htmlBody
    });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to send email: ' + err.message });
  }

  return jsonResponse({ success: true, message: 'Review request sent to ' + email });
}

// Public: Submit a testimonial (token-authenticated)
function handleSubmitTestimonial(data) {
  var token = (data.token || '').trim();
  var displayName = (data.displayName || '').trim();
  var rating = parseInt(data.rating);
  var text = (data.text || '').trim();

  if (!token) return jsonResponse({ success: false, error: 'Missing token' });
  if (!displayName) return jsonResponse({ success: false, error: 'Display name is required' });
  if (!rating || rating < 1 || rating > 5) return jsonResponse({ success: false, error: 'Rating must be 1–5' });
  if (text.length < 20) return jsonResponse({ success: false, error: 'Review must be at least 20 characters' });

  var sheet = getTestimonialSheet();
  if (!sheet) return jsonResponse({ success: false, error: 'System error' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      var status = rows[i][6];
      if (status !== 'requested') {
        return jsonResponse({ success: false, error: 'This review has already been submitted' });
      }
      // Update: DisplayName (col D), Rating (col E), Text (col F), Status (col G), SubmittedAt (col I)
      sheet.getRange(i + 1, 4).setValue(displayName);
      sheet.getRange(i + 1, 5).setValue(rating);
      sheet.getRange(i + 1, 6).setValue(text);
      sheet.getRange(i + 1, 7).setValue('pending');
      sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
      return jsonResponse({ success: true, message: 'Thank you! Your review has been submitted for approval.' });
    }
  }

  return jsonResponse({ success: false, error: 'Invalid or expired review link' });
}

// Admin: Approve or reject a testimonial
function handleReviewTestimonial(data) {
  var auth = verifyAdminToken(data.idToken);
  if (!auth.ok) return jsonResponse({ success: false, error: auth.error });

  var token = (data.token || '').trim();
  var decision = (data.decision || '').trim(); // 'approved' or 'rejected'
  if (!token || (decision !== 'approved' && decision !== 'rejected')) {
    return jsonResponse({ success: false, error: 'Token and valid decision (approved/rejected) required' });
  }

  var sheet = getTestimonialSheet();
  if (!sheet) return jsonResponse({ success: false, error: 'Sheet not configured' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      sheet.getRange(i + 1, 7).setValue(decision);     // Status
      sheet.getRange(i + 1, 10).setValue(new Date().toISOString()); // ReviewedAt
      return jsonResponse({ success: true, message: 'Testimonial ' + decision });
    }
  }

  return jsonResponse({ success: false, error: 'Testimonial not found' });
}

// Admin: Get all testimonials
function handleGetTestimonials(data) {
  var auth = verifyAdminToken(data.idToken);
  if (!auth.ok) return jsonResponse({ success: false, error: auth.error });

  var sheet = getTestimonialSheet();
  if (!sheet) return jsonResponse({ success: true, testimonials: [] });

  var rows = sheet.getDataRange().getValues();
  var testimonials = [];
  for (var i = 1; i < rows.length; i++) {
    testimonials.push({
      token: rows[i][0],
      email: rows[i][1],
      patientName: rows[i][2],
      displayName: rows[i][3],
      rating: rows[i][4],
      text: rows[i][5],
      status: rows[i][6],
      requestedAt: rows[i][7],
      submittedAt: rows[i][8],
      reviewedAt: rows[i][9]
    });
  }

  return jsonResponse({ success: true, testimonials: testimonials });
}

// Public: Get approved testimonials (for homepage)
function handleGetApprovedTestimonials() {
  var sheet = getTestimonialSheet();
  if (!sheet) return jsonResponse({ success: true, testimonials: [] });

  var rows = sheet.getDataRange().getValues();
  var approved = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][6] === 'approved') {
      approved.push({
        displayName: rows[i][3],
        rating: rows[i][4],
        text: rows[i][5],
        submittedAt: rows[i][8]
      });
    }
  }

  return jsonResponse({ success: true, testimonials: approved });
}

// Public: Get testimonial info by token (for review.html)
function handleGetTestimonialByToken(token) {
  if (!token) return jsonResponse({ success: false, error: 'Missing token' });

  var sheet = getTestimonialSheet();
  if (!sheet) return jsonResponse({ success: false, error: 'System error' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      return jsonResponse({
        success: true,
        patientName: rows[i][2],
        status: rows[i][6]
      });
    }
  }

  return jsonResponse({ success: false, error: 'Invalid review link' });
}

// ═══════════════════════════════════════════════════════════════
// ─── ADMIN CALENDAR DASHBOARD — BOOKING REVIEW ───
// ═══════════════════════════════════════════════════════════════

// Admin: Get all bookings
function handleGetBookings(idToken) {
  var auth = verifyAdminToken(idToken);
  if (!auth.ok) return jsonResponse({ success: false, error: auth.error });

  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('BOOKING_LOG_SHEET_ID');
  if (!sheetId) return jsonResponse({ success: true, bookings: [] });

  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Bookings');
  if (!sheet) return jsonResponse({ success: true, bookings: [] });

  var rows = sheet.getDataRange().getValues();
  var bookings = [];
  for (var i = 1; i < rows.length; i++) {
    bookings.push({
      confirmation: rows[i][0] || '',
      date: rows[i][1] || '',
      time: rows[i][2] || '',
      service: rows[i][3] || '',
      email: rows[i][4] || '',
      phone: rows[i][5] || '',
      firstName: rows[i][6] || '',
      lastName: rows[i][7] || '',
      insurance: rows[i][8] || '',
      bookedAt: rows[i][9] || '',
      status: rows[i][10] || 'pending'
    });
  }

  return jsonResponse({ success: true, bookings: bookings });
}

// Admin: Confirm or decline a booking
function handleReviewBooking(data) {
  var auth = verifyAdminToken(data.idToken);
  if (!auth.ok) return jsonResponse({ success: false, error: auth.error });

  var confirmationCode = (data.confirmationCode || '').trim();
  var decision = (data.decision || '').trim();
  if (!confirmationCode || (decision !== 'confirmed' && decision !== 'declined')) {
    return jsonResponse({ success: false, error: 'Confirmation code and valid decision (confirmed/declined) required' });
  }

  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('BOOKING_LOG_SHEET_ID');
  if (!sheetId) return jsonResponse({ success: false, error: 'Sheet not configured' });

  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Bookings');
  if (!sheet) return jsonResponse({ success: false, error: 'Bookings sheet not found' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === confirmationCode) {
      // Update Status column (K = column 11, 1-based)
      sheet.getRange(i + 1, 11).setValue(decision);

      var rowData = {
        confirmation: rows[i][0] || '',
        date: rows[i][1] || '',
        time: rows[i][2] || '',
        service: rows[i][3] || '',
        email: rows[i][4] || '',
        phone: rows[i][5] || '',
        firstName: rows[i][6] || '',
        lastName: rows[i][7] || '',
        insurance: rows[i][8] || '',
        bookedAt: rows[i][9] || ''
      };

      try {
        if (decision === 'confirmed') {
          sendBookingConfirmationEmail(rowData);
        } else {
          sendBookingDeclineEmail(rowData);
        }
      } catch (err) {
        Logger.log('Review email error: ' + err);
        return jsonResponse({ success: true, message: 'Booking ' + decision + ' but email failed: ' + err.message });
      }

      return jsonResponse({ success: true, message: 'Booking ' + decision });
    }
  }

  return jsonResponse({ success: false, error: 'Booking not found' });
}

// ─── Send confirmation email when booking is confirmed by admin ───
function sendBookingConfirmationEmail(rowData) {
  var dateObj = new Date(rowData.date + 'T00:00:00');
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var dateStr = dateObj.toLocaleDateString('en-US', options);

  var subject = 'Appointment Confirmed - ' + PRACTICE_NAME;

  var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
    '<div style="background: #2C4A5A; padding: 24px 32px; border-radius: 12px 12px 0 0;">' +
      '<h1 style="color: white; margin: 0; font-size: 20px;">' + PRACTICE_NAME + '</h1>' +
      '<p style="color: #D4A855; margin: 4px 0 0; font-size: 14px;">Appointment Confirmed</p>' +
    '</div>' +
    '<div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">' +
      '<p style="font-size: 16px; color: #1e293b;">Hello ' + escHtml(rowData.firstName) + ',</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Great news! Your appointment has been confirmed.</p>' +
      '<div style="background: #2C4A5A; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: center;">' +
        '<p style="color: #b0c4ce; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>' +
        '<p style="color: #D4A855; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 2px;">' + escHtml(rowData.confirmation) + '</p>' +
      '</div>' +
      '<div style="background: #f8fafb; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">' +
        '<table style="width: 100%; font-size: 14px;">' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(dateStr) + '</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Time</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(rowData.time) + ' ET</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Service</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(rowData.service) + '</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Provider</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">' + escHtml(PROVIDER_NAME) + '</td></tr>' +
          '<tr><td style="padding: 6px 0; color: #64748b;">Format</td><td style="padding: 6px 0; font-weight: 600; color: #1e293b; text-align: right;">Secure Telehealth (Video)</td></tr>' +
        '</table>' +
      '</div>' +
      '<div style="background: #faf5eb; border: 1px solid #D4A855; border-radius: 10px; padding: 20px; margin: 20px 0;">' +
        '<p style="font-weight: 700; color: #2C4A5A; margin: 0 0 8px; font-size: 15px;">Complete Your Intake Forms</p>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">Please complete your intake forms before your appointment through our patient portal:</p>' +
        '<div style="text-align: center; margin: 12px 0;">' +
          '<a href="https://portal.kareo.com/pp-webapp/app/new/login" style="display: inline-block; background: #D4A855; color: #1a3545; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">Open Patient Portal</a>' +
        '</div>' +
      '</div>' +
      '<div style="background: #f8fafb; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">' +
        '<p style="font-weight: 700; color: #2C4A5A; margin: 0 0 8px; font-size: 14px;">Before Your Appointment</p>' +
        '<ul style="color: #64748b; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">' +
          '<li>Have your insurance card, medication list, and photo ID ready</li>' +
          '<li>A secure video link will be sent to you before your appointment</li>' +
          '<li>Find a quiet, private space with good internet</li>' +
          '<li>Test your camera and microphone beforehand</li>' +
        '</ul>' +
      '</div>' +
      '<p style="color: #64748b; font-size: 14px; line-height: 1.6;">Questions? Call us at <strong>(407) 796-2406</strong> or reply to this email.</p>' +
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">' +
      '<p style="font-size: 12px; color: #94a3b8; text-align: center;">' + PRACTICE_NAME + ' &bull; (407) 796-2406 &bull; ennhealth.com</p>' +
    '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: rowData.email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// ─── Send decline email when booking is declined by admin ───
function sendBookingDeclineEmail(rowData) {
  var subject = 'Appointment Request Update - ' + PRACTICE_NAME;

  var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
    '<div style="background: #2C4A5A; padding: 24px 32px; border-radius: 12px 12px 0 0;">' +
      '<h1 style="color: white; margin: 0; font-size: 20px;">' + PRACTICE_NAME + '</h1>' +
      '<p style="color: #D4A855; margin: 4px 0 0; font-size: 14px;">Appointment Request Update</p>' +
    '</div>' +
    '<div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">' +
      '<p style="font-size: 16px; color: #1e293b;">Hello ' + escHtml(rowData.firstName) + ',</p>' +
      '<p style="color: #64748b; line-height: 1.6;">Thank you for your interest in ' + PRACTICE_NAME + '. After reviewing your appointment request, we\'d like to discuss your care needs further to ensure we can provide the best possible support.</p>' +
      '<p style="color: #64748b; line-height: 1.6;">We want to make sure you receive the right level of care tailored to your individual needs, and a brief conversation will help us determine the best path forward for you.</p>' +
      '<div style="background: #faf5eb; border: 1px solid #D4A855; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">' +
        '<p style="font-weight: 700; color: #2C4A5A; margin: 0 0 8px; font-size: 15px;">Please Give Us a Call</p>' +
        '<p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">Call us so we can discuss the best options for your care.</p>' +
        '<a href="tel:4077962406" style="display: inline-block; background: #D4A855; color: #1a3545; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px;">(407) 796-2406</a>' +
      '</div>' +
      '<p style="color: #64748b; font-size: 14px; line-height: 1.6;">Our team is available Monday through Friday, and we look forward to speaking with you soon.</p>' +
      '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">' +
      '<p style="font-size: 12px; color: #94a3b8; text-align: center;">' + PRACTICE_NAME + ' &bull; (407) 796-2406 &bull; ennhealth.com</p>' +
    '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: rowData.email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// ─── Send notification to practice ───
function sendPracticeNotification(data) {
  var dateObj = new Date(data.date + 'T' + data.time + ':00');
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var dateStr = dateObj.toLocaleDateString('en-US', options);

  // Subject uses initials only — avoid full names in email subject lines (visible in previews/logs)
  var initials = (data.firstName ? data.firstName.charAt(0) : '') + (data.lastName ? data.lastName.charAt(0) : '');
  var subject = 'New Booking: ' + initials.toUpperCase() + ' - ' + data.apptType + ' (' + dateStr + ')';

  var body = 'NEW APPOINTMENT BOOKING\n\n' +
    'Confirmation: ' + (data.confirmationCode || 'N/A') + '\n' +
    'Service: ' + data.apptType + '\n' +
    'Date: ' + dateStr + '\n' +
    'Time: ' + data.timeLabel + ' ET\n' +
    'Duration: ' + data.duration + ' min\n\n' +
    'Patient: ' + data.firstName + ' ' + data.lastName + '\n' +
    'Email: ' + data.email + '\n' +
    'Phone: ' + data.phone + '\n' +
    'DOB: ' + data.dob + '\n' +
    'Insurance: ' + (data.insurance || 'Not specified') + '\n' +
    'Reason: ' + (data.reason || 'Not specified') + '\n\n' +
    'This event has been added to your Google Calendar.\n\n' +
    'ACTION REQUIRED:\n' +
    '1. Create this appointment in Tebra\n' +
    '2. Send intake forms from the appointment screen\n' +
    '3. Patient confirmation email includes portal link\n\n' +
    'Booked via ennhealth.com';

  MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}
