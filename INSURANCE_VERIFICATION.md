# Insurance Eligibility Verification via Stedi API

## Context
Patients currently select insurance during booking but coverage is never verified. We're adding real-time eligibility checks using the Stedi Healthcare API (270/271 transactions, free tier: 100 checks/month) through the existing Google Apps Script backend. Two integration points: a standalone checker in the pricing section (lead gen) and inline verification in the booking flow.

## Status
- **Code:** Committed and deployed (commit `f773a11`)
- **Files modified:** `google-apps-script.js`, `index.html`, `main.js`, `styles.css`
- **Remaining:** Stedi account setup, Apps Script redeployment, testing

---

## Architecture

```
Patient enters insurance info on ennhealth.com
    → POST to Apps Script (action: checkEligibility)
    → Apps Script calls Stedi API (member ID, DOB, payer ID, NPI)
    → Stedi returns 271 response (benefits, copay, deductible)
    → Apps Script parses → returns simplified JSON
    → Frontend renders results card (active/inactive/error)
```

---

## Setup Steps (TODO)

### 1. Create Stedi Account
- Sign up at https://www.stedi.com
- Free tier: 100 eligibility checks/month
- Get your API key from the Stedi dashboard

### 2. Store Credentials in Apps Script
Run these in the Apps Script editor (one-time):
```javascript
PropertiesService.getScriptProperties().setProperty('STEDI_API_KEY', 'key-here');
PropertiesService.getScriptProperties().setProperty('PROVIDER_NPI', 'npi-here');
PropertiesService.getScriptProperties().setProperty('PROVIDER_ORG', 'EnnHealth Psychiatry');
```

### 3. Deploy Apps Script
- Open Apps Script editor
- Copy latest `google-apps-script.js` content
- Deploy → New deployment → Web app → Execute as "Me", access "Anyone"
- Note: must create a **new version**, not update existing

### 4. Test
- Use Stedi test payer ID `STEDI` for mock data
- Test all 3 result states: active, inactive, error
- Test standalone form (pricing section)
- Test inline verify (booking Step 3)
- Test persistence: standalone verify → book → badge auto-appears

---

## Supported Carriers

| Carrier | Stedi Trading Partner ID |
|---------|--------------------------|
| Aetna | 60054 |
| Blue Cross Blue Shield | BCBSF |
| Cigna | 62308 |
| UnitedHealthcare | 87726 |
| Humana | 61101 |
| Oscar Health | OSCAR |
| Ambetter | AMB01 |
| Medicare | CMS |
| Tricare | TRIC |
| Molina Healthcare | MOLIN |

> **Note:** BCBS, Oscar, Ambetter, Tricare, and Molina IDs should be verified against Stedi's payer network directory.

---

## Rate Limiting
- Monthly counter stored in `PropertiesService` as `ELIG_COUNT_YYYY-MM`
- Cap at 95 checks/month (5 buffer on 100 free tier)
- When exceeded: friendly error with phone number fallback

---

## Frontend Features

### Standalone Checker (Pricing Section)
- "Check My Coverage" button toggles inline form
- Fields: insurance dropdown, member ID, DOB, optional first/last name
- Results: green (active with benefits grid), amber (inactive), gray (error)
- CTA links to booking with insurance pre-filled

### Booking Flow (Step 3)
- Inline verify prompt appears when supported carrier selected
- Compact result badge: "Coverage Verified — Copay: $30, Coinsurance: 20%"
- Persists result from standalone checker via `window.eligibilityResult`

---

## Files Changed

| File | What was added |
|------|----------------|
| `google-apps-script.js` | `PAYER_MAP`, `handleCheckEligibility()`, `parseEligibilityResponse()`, `checkEligibilityRateLimit()`, route in `doPost` |
| `index.html` | Eligibility form in pricing section, inline verify in booking Step 3 |
| `main.js` | `checkEligibility()`, `renderEligibilityResults()`, `onBookingInsuranceChange()`, `checkBookingEligibility()`, `prefillBookingInsurance()` |
| `styles.css` | `.eligibility-form`, `.elig-result`, `.elig-benefits` grid, `.elig-booking-badge`, mobile responsive |
