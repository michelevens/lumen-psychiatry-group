# EnnHealth Psychiatry — Improvement Plan

**Domain:** ennhealth.com
**Last updated:** 2026-03-03
**Status:** Active

---

## Current State

### Live Pages (41+ total)
- **Homepage:** index.html — hero with live booking, services, insurance checker w/ payer logos, FAQ
- **Conditions:** adhd/, anxiety/, alcohol-use/, depression/, ptsd/, bipolar/, insomnia/, ocd/, genetic-testing/ (9 pages)
- **Blog:** 12 articles (ADHD, anxiety, telehealth, insurance, PMHNP, medication management, etc.)
- **Locations:** 10 state pages + hub (/locations/florida/, /locations/new-york/, etc.)
- **About:** /about/ — provider credentials, E-E-A-T (Physician schema)
- **FAQ:** /faq/ — 20 FAQs, 5 categories, structured data
- **Legal:** privacy, terms, telehealth-consent, cancellation-policy, communications-consent
- **Patient:** intake.html (intake form), review.html (review submission)
- **Admin:** admin.html (office hours, service areas), license-tracker.html, credentialing-tracker.html, credentialing-setup.html

### Apps Scripts (2 deployments)
| Script | URL ID | Status |
|---|---|---|
| Booking V5 (multi-calendar) | AKfycbz64vu0w... | LIVE — checks all 4 calendars |
| License Tracker | AKfycbxps6OS1... | LIVE — 51 states in Google Sheet |

### Calendars Synced
1. Dr Nageley Michel, DNP (primary — bookings created here)
2. Family
3. Holidays in United States
4. Rula Calendar

### Office Hours (admin-configured)
- Sun: Closed
- Mon: 9 AM - 10 PM
- Tue: 10 AM - 10 PM
- Wed: Closed
- Thu: 9 AM - 10 PM
- Fri: 9 AM - 10 PM
- Sat: 9 AM - 10 PM

---

## Completed (2026-03-03) — Session 3

### Credentialing Tracker Fixes
- [x] **TDZ error fix (57d8cdb):** Moved auto-auth check after variable declarations — was crashing on page load
- [x] **Save/preset bugs (8f06eca, 53598bc):** Fixed local fallback, cloud retry guard, broken form layout
- [x] **Date format fix (ff9efef):** Dates were displaying as raw `Date.toString()` (e.g., "Mon Mar 02 2026 00:00:00 GMT-0500"). Added `formatDate()` (MM/DD/YYYY display) + `normalizeDate()` (YYYY-MM-DD storage)
- [x] **Cloud sync reliability (ff9efef):** Increased timeout from 8s → 15s, replaced permanent `cloudFailed` flag with retry counter (3 attempts), added "Retry" button
- [x] **credType & providerId persistence (95fc6aa):** Cloud Apps Script doesn't have these columns. When cloud data overwrote local, these fields were lost. Added `mergeCloudWithLocal()` to preserve local-only fields; stopped `saveCloudData()` from overwriting local data
- [x] **Payer logo badges in tracker (44bfeb5):** Added `PAYER_LOGOS` mapping (27 payers → SVG filenames) and `payerLogo()` helper — each payer row shows branded badge

### Mobile Menu Fix
- [x] **Smooth slide animation (08183b1):** `display:none` → `display:flex` was killing CSS transitions. Fixed in both `styles.css` (homepage) and `shared-header.js` (all subpages) by using `visibility:hidden` + `pointer-events:none` with transition delays

### Payer Logo Badges
- [x] **Created 27 branded SVG badges (44bfeb5):** Each payer's actual brand color (Aetna purple #7B2D8B, UHC navy #002677, Humana green #43B02A, etc.). Stored in `assets/logos/payers/`
- [x] **Homepage integration:** Replaced plain text `.ins-logo` spans with `<img>` tags using SVG badges, added hover lift animation
- [x] **Tracker integration:** Branded badge shown next to payer name in table rows

### Cloud Sync Status
- Google Apps Script endpoint is WORKING (confirmed via curl — returns valid JSON with CORS headers)
- Script stores: id, state, payer, wave, status, applied, followup, effective, revenue, notes
- Script does NOT store: credType, providerId (added after script was created)
- Browser timeout was the issue (8s was too short for Apps Script cold starts)

---

## Completed (2026-03-02)

### Session 1
- [x] Replaced old Apps Script with V5 multi-calendar version
- [x] Clean deployment — deleted all old script copies, single "New EnnHealth Appt" project
- [x] All 4 Google Calendars now reflected in availability
- [x] Updated APPS_SCRIPT_URL in main.js + admin.html
- [x] Fixed race condition: hero + calendar grid now wait for dynamic office hours
- [x] Updated hardcoded default hours to match actual schedule (Wed closed, Tue 10AM)
- [x] Hero skips closed days dynamically (was hardcoded to skip only Sunday)
- [x] Verified license tracker script still working
- [x] google-apps-script.js saved locally (was empty "we" before)

### Session 2
- [x] P2.1: Booking confirmation codes (ENH-YYYYMMDD-XXX) — server-side generation, displayed in confirmation screen, included in patient email, practice email, and calendar event
- [x] P2.2: Admin calendar picker — UI in admin.html shows all Google Calendars with toggle switches, auto-saves selection to PropertiesService, getBusyTimes respects selection
- [x] P2.3: Appointment reminders — sendAppointmentReminders() function scans tomorrow's calendar for ennhealth.com bookings and sends styled reminder emails. logBookingToSheet() records bookings for reliable email lookup. Needs daily trigger setup in Apps Script editor.
- [x] P3.1: Fixed Schema.org office hours (removed Wednesday, Tuesday starts at 10AM)
- [x] P3.2: Created 5 new condition SEO landing pages — depression, PTSD/trauma, bipolar disorder, insomnia/sleep disorders, OCD. All with full Schema.org (MedicalWebPage, BreadcrumbList, FAQPage), unique clinical content, medication details, and FAQ sections.
- [x] P3.3: Updated sitemap.xml with all 5 new condition pages

---

## Priority 1 — Quick Wins (1-2 hours each)

### 1.1 License Tracker Data Entry
**Status:** Needs user input
**What:** All 51 states have empty license_type, license_number, issued, expiration, in_nursys, ceu_required, ceu_completed fields.
**Action:** Fill in real license data through the license tracker admin page (admin/license-tracker.html).
**Fields to complete:**
- license_type: "Compact" or "Individual APRN" or "PMHNP"
- license_number: Actual NP license number per state
- issued / expiration: License dates
- in_nursys: Yes/No
- ceu_required / ceu_completed: CEU tracking
- notes: Any state-specific notes

### 1.2 Stedi API Key Setup
**Status:** Not configured
**What:** Insurance eligibility checks return "temporarily unavailable" because no Stedi API key is set.
**Action:**
1. Sign up at https://www.stedi.com (free tier = 100 checks/month)
2. Get API key
3. In Google Apps Script → Project Settings → Script Properties, add:
   - `STEDI_API_KEY` = your Stedi API key
   - `PROVIDER_NPI` = your NPI number
   - `PROVIDER_ORG` = "EnnHealth Psychiatry" (or your org name)
4. Test with: Insurance = "Aetna", Member ID = test, DOB = test date

### 1.3 Expand Payer Map
**Status:** Only 10 carriers
**Current:** Aetna, BCBS, Cigna, UnitedHealthcare, Humana, Oscar, Ambetter, Medicare, Tricare, Molina
**Missing common carriers:**
- Anthem (separate from BCBS in some states)
- Carefirst
- Optum / OptumHealth Behavioral
- Magellan Health
- Wellcare (now Centene)
- Bright Health
- Devoted Health
- Clover Health
**Action:** Update PAYER_MAP in google-apps-script.js, redeploy

---

## Priority 2 — Medium Improvements (half day each)

### 2.1 Booking Confirmation Numbers ✓ DONE
**Status:** Completed
**What:** Confirmation code `ENH-YYYYMMDD-XXX` generated server-side, returned in booking response, displayed on confirmation screen, included in patient email (styled banner), practice notification, and calendar event description.

### 2.2 Admin Calendar Picker ✓ DONE
**Status:** Completed
**What:** Admin panel now shows all Google Calendars with toggle switches. Selection auto-saves to PropertiesService. `getBusyTimes` respects the filter (unchecked calendars are excluded from availability).

### 2.3 Automated Appointment Reminders ✓ DONE
**Status:** Completed (needs trigger setup)
**What:** `sendAppointmentReminders()` scans tomorrow's calendar events for ennhealth.com bookings and sends styled email reminders. `logBookingToSheet()` records all bookings to a Google Sheet.
**Setup required:**
1. In Apps Script editor → Triggers (clock icon) → Add Trigger
2. Function: `sendAppointmentReminders`, Event source: Time-driven, Type: Day timer, Time: 6pm-7pm
3. In Script Properties, add `BOOKING_LOG_SHEET_ID` = your Google Sheet ID

### 2.4 Patient Portal Deep Link
**Status:** Not started
**What:** Confirmation email links to Tebra patient portal login page. Could pre-fill or deep link.
**Action:** If Tebra supports URL params, add patient identifiers to the portal link.

---

## Priority 3 — SEO & Growth (1-2 days)

### 3.1 Structured Data (Schema.org) ✓ DONE
**Status:** Completed
**What:** index.html already had comprehensive Schema.org data (MedicalBusiness, Physician, FAQPage, WebSite, MedicalClinic, BreadcrumbList). Fixed office hours specification to match actual schedule (Wed closed, Tue 10AM). All condition pages have MedicalWebPage, BreadcrumbList, and FAQPage schemas.

### 3.2 Google Business Profile
**What:** Ensure GBP is claimed, verified, and synced with website hours.
**Action:** Verify listing, add all service areas (30+ states), link to booking page.

### 3.3 More Condition Pages ✓ DONE
**Status:** Completed
**Current:** ADHD, Anxiety, Alcohol Use, Depression, PTSD, Bipolar, Insomnia, OCD (8 total)
**Still possible:** Medication Management (general landing page)
**What was done:** Created 5 new SEO-optimized landing pages following the ADHD template pattern. Each has unique clinical content, treatment info, medication details, Schema.org structured data, and FAQ section.

### 3.4 Blog Content Calendar
**Current:** 8 blog posts
**Suggested cadence:** 2 posts/month for SEO
**Topics:**
- "Telehealth psychiatry in [state]" (one per active state — 28 pages!)
- "How to know if you need a psychiatrist vs therapist"
- "ADHD in women: underdiagnosis and treatment"
- "Managing anxiety without medication"
- "What to expect at your first telehealth appointment"

### 3.5 Sitemap Updates ✓ DONE
**Status:** Completed
**What:** Added all 5 new condition pages to sitemap.xml. Total URLs now: 22 (home + 8 conditions + 5 legal + intake + blog index + 8 blog posts).

---

## Priority 4 — Operational / Backend

### 4.1 Consolidate Apps Scripts
**What:** Booking script and license tracker are separate projects/deployments.
**Option A:** Keep separate (simpler, current approach)
**Option B:** Merge into one script with routing (one URL to manage)
**Recommendation:** Keep separate — they serve different Google Sheets

### 4.2 Booking Data Backup
**What:** Bookings are only in Google Calendar. If calendar event is deleted, data is lost.
**Action:** Add a "Bookings" sheet to log all appointments (the V5 script already has `logBookingToSheet` but needs a linked Google Sheet).

### 4.3 Analytics
**What:** No analytics visible in codebase.
**Action:** Add Google Analytics 4 (GA4) or Plausible. Track:
- Booking funnel completion rate
- Insurance checker usage
- Blog post engagement
- Condition page → booking conversion

### 4.4 HIPAA Compliance Audit
**Items to verify:**
- [ ] BAA with Google (Workspace account required)
- [ ] BAA with GitHub Pages (or move to HIPAA-compliant host)
- [ ] Email notifications contain minimal PHI (initials only — already done)
- [ ] Calendar events use initials only (already done)
- [ ] No patient data in browser localStorage/cookies
- [ ] SSL/TLS enforced everywhere (GitHub Pages auto-HTTPS)

---

## Architecture Reference

```
ennhealth.com (GitHub Pages)
├── index.html          ← main.js (booking calendar, hero, insurance checker)
├── admin.html          ← office hours management, service area toggles
├── intake.html         ← patient intake form
├── adhd/anxiety/alcohol-use/depression/ptsd/bipolar/insomnia/ocd/  ← condition SEO pages
├── blog/               ← 8 articles
├── admin/
│   ├── license-tracker.html    → Apps Script #2 (Google Sheet)
│   ├── credentialing-tracker.html
│   └── credentialing-setup.html
└── legal pages (privacy, terms, consents)

Apps Script #1: "New EnnHealth Appt" (Booking)
├── GET ?action=availability&date=YYYY-MM-DD  → busy times from ALL calendars
├── GET ?action=getOfficeHours                → admin-configured hours
├── GET ?action=getCalendars                  → list all Google Calendars
├── POST (booking data)                       → creates calendar event + emails
├── POST action=setOfficeHours                → save hours (admin auth required)
└── POST action=checkEligibility              → Stedi API insurance check

Apps Script #2: "License Tracker" (Credentialing)
├── GET ?action=getAll      → all 51 states
├── GET ?action=getPublic   → active + pending states only
├── POST action=add         → add state
├── POST action=update      → update state
├── POST action=delete      → remove state
└── POST action=bulkReplace → replace all data
```

---

## Notes
- Default office hours in main.js should be updated whenever admin changes hours
- Apps Script PropertiesService is per-deployment — new deployments lose saved settings
- License tracker is a SEPARATE Google Apps Script project — do not delete it when managing booking script
- Rula Calendar is an imported (.ics) calendar — events from Rula now block booking slots
