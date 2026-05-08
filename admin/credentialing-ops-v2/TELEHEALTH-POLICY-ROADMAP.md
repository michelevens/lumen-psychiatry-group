# EnnHealth Credentialing Ops v2 — Features & Roadmap

## Platform Overview

**EnnHealth Credentialing Ops v2** is a full-featured telehealth credentialing & licensing management platform built as a vanilla HTML/CSS/JS Progressive Web App (PWA) backed by Google Sheets via Apps Script.

- **Live**: Hosted on GitHub Pages
- **Backend**: Google Sheets (Apps Script REST API) with localStorage fallback
- **Architecture**: Cache-first — all reads instant from memory, writes sync async to Sheets
- **Mobile**: PWA + Capacitor (Android & iOS native builds)

---

## Implemented Features

### 1. Dashboard
- Organization & provider summary header
- License stats: active, pending, expiring, expired counts
- Telehealth readiness overview (avg readiness score, practice authority, controlled substances)
- Top expansion state recommendations
- **Interactive Charts** (Chart.js):
  - Pipeline doughnut (applications by status)
  - Revenue horizontal bar (approved vs projected)
  - License timeline bar (expiring licenses by month)
  - Payer catalog doughnut (payer categories)
- Overdue/upcoming follow-ups widget
- Escalation candidates

### 2. Applications Management
- Full CRUD for credentialing applications
- Sortable/filterable table (by state, payer, status, wave, search)
- Per-application fields: provider, state, payer, wave, status, type, dates, enrollment ID, est. revenue, portal URL, payer contacts, notes
- **Status change logging**: Automatic activity log when status changes (with required note)
- Action buttons per row: Log, Hist, **Docs**, Edit, Del

### 3. Document Checklist
- **22 credentialing documents** across 6 categories:
  - **Provider**: CAQH ProView Profile, NPI Confirmation Letter
  - **License**: State License Copy, DEA Certificate, State CDS Certificate
  - **Education**: Board Certification, Diploma/Degree, CV/Resume
  - **Insurance**: Malpractice Insurance (COI), Malpractice Claims History
  - **Billing**: W-9, Voided Check/EFT Form, ERA Enrollment, Tax ID/EIN Letter
  - **Compliance**: Collaborative Practice Agreement, Background Check, Medicare Opt-Out, Telehealth Consent Template
  - **Payer**: Disclosure/Attestation Form, Payer Application Form, Signed Contract, Fee Schedule
- Progress bar per application (% complete)
- Per-category completion counts
- Date stamp and optional note per document
- Check All / Uncheck All bulk actions

### 4. Task Manager
- **90+ preset task suggestions** organized by 11 categories:
  - Credentialing, License Renewal, Follow-up, Payer Enrollment, Document Request, Compliance, Billing Setup, Provider Onboarding, State Expansion, Audit/Review, Other
- **Smart combo input**: Datalist dropdown with presets that auto-sets category & priority; free-text input also accepted
- 4 priority levels: Urgent, High, Normal, Low (color coded)
- Due dates with overdue detection (red border, grouped at top)
- Link tasks to specific applications
- Notes field per task
- Sections: Overdue → Due Today → Upcoming → Completed (collapsible)
- Header quick-action buttons: **☑ Tasks** and **✚ Quick Add**

### 5. Follow-ups System
- Overdue and upcoming follow-up tracking
- Linked to applications with auto-generated follow-ups on status transitions
- Complete workflow: mark done with outcome + next action
- Badge count in sidebar navigation
- Escalation detection for aged applications

### 6. Provider Management
- Provider profiles: name, credentials, NPI, specialty, license details
- Multi-provider support
- Default provider seeding on first load

### 7. License Tracking
- State licenses with status, type, expiration dates
- Expiring (< 90 days) and expired license detection
- Filter by provider

### 8. Payer Catalog
- Full catalog of insurance payers with categories
- Payer details: name, category, website, notes

### 9. State Telehealth Policies
- All 50 states + DC policy data
- Fields: practice authority, controlled substances, telehealth parity, consent requirements, in-person requirements, originating site rules, compact membership, Medicaid telehealth coverage, audio-only, cross-state licensing, Ryan Haight exemption, readiness score
- **Freshness tracking**: AGING (> 90 days) and STALE (> 180 days) badges
- Filter by readiness, region
- Detailed state policy drill-down view
- **Google Sheets-backed with static fallback**: Auto-seeds from static data on first load

### 10. Payer-State Coverage Matrix
- Heatmap grid showing credentialing status across all state × payer combinations
- Color-coded cells: approved (green), submitted/in-review (blue), pending (amber), denied (red), not started (gray)
- Gap analysis identifying uncovered payer-state combinations
- Sticky first column for horizontal scrolling
- Compact 14×14px cells for dense overview

### 11. Revenue Forecast
- 12-month pipeline projection based on historical data
- Metrics: average credentialing days, approval rate, projected pipeline revenue
- **Charts**:
  - Revenue projection line chart (cumulative approved + projected)
  - Pipeline stacked bar chart (by status per month)

### 12. Batch Generator
- Generate application batches from strategy profiles
- Select strategy, target states, exclude existing
- Preview before committing
- Summary stats: applications count, states, payers, est. monthly revenue

### 13. Email Generator
- Template-based email generation for credentialing communications
- Per-application email generation
- Bulk expansion email batches
- Escalation email generation
- Copy to clipboard

### 14. Activity Logging
- Per-application activity log
- Log types: phone call, email, fax, portal check, status change, note
- Fields: date, contact name, phone, reference number, outcome, next step
- Full history view per application

### 15. Settings & Data Management
- Organization settings (name, NPI, EIN)
- Import from V1 (localStorage or Google Sheets)
- CSV import
- JSON export/backup
- Clear applications / follow-ups / everything
- Data management tabs

### 16. PWA Support
- Service worker with cache-first strategy (stale-while-revalidate)
- Offline capability via localStorage fallback
- App manifest with icons
- Installable on mobile/desktop

### 17. Capacitor Mobile App
- **Android + iOS** native app builds via Capacitor
- Plugins installed:
  - `@capacitor/app` — App lifecycle management
  - `@capacitor/splash-screen` — Branded splash (teal background, gold spinner)
  - `@capacitor/status-bar` — Dark status bar (#1a2f3a)
  - `@capacitor/keyboard` — Keyboard resize handling
  - `@capacitor/haptics` — Haptic feedback
  - `@capacitor/local-notifications` — Push-style local notifications
- Build commands:
  - `npm run cap:sync` — Build + sync web assets to native projects
  - `npm run cap:open:android` — Open in Android Studio
  - `npm run cap:open:ios` — Open in Xcode
  - `npm run cap:run:android` / `npm run cap:run:ios` — Build & run on device

### 18. Print Support
- Print button on all pages
- Print-optimized CSS: hides sidebar, modals, action buttons
- Clean table formatting for printed reports

### 19. Google Sheets Sync
- Debounced async writeback (800ms)
- Retry logic (3 attempts with backoff)
- Sync status indicator in sidebar footer
- Collections synced: organizations, providers, licenses, payers, applications, followups, strategy_profiles, activity_logs, telehealth_policies, tasks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (ES Modules) |
| Charts | Chart.js 4.4.7 (CDN) |
| Backend | Google Apps Script (deployed as web app) |
| Database | Google Sheets (9 collection tabs) |
| Offline | localStorage fallback + Service Worker |
| Mobile | Capacitor 8.x (Android + iOS) |
| Hosting | GitHub Pages |
| CI/CD | Manual git push → GitHub Pages auto-deploy |

---

## File Structure

```
credentialing-ops-v2/
├── index.html                 # App shell, modals, navigation
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker (cache v11)
├── capacitor.config.json      # Capacitor native app config
├── package.json               # Capacitor dependencies & scripts
├── .gitignore                 # Excludes node_modules, www, android, ios
│
├── ui/
│   ├── app.js                 # Main app controller (~3000 lines)
│   └── styles.css             # All styles (~800 lines)
│
├── core/
│   ├── store.js               # Data store (cache + Sheets sync)
│   ├── workflow.js            # Status transitions, follow-ups
│   ├── batch-generator.js     # Batch application generation
│   ├── email-generator.js     # Email template engine
│   └── migration.js           # V1 import/export utilities
│
├── data/
│   ├── schema.js              # Entity schemas, validation
│   ├── payers.js              # Payer catalog (national payers)
│   ├── providers.js           # Default provider/org data
│   ├── states.js              # US states list
│   ├── strategies.js          # Credentialing strategy profiles
│   └── telehealth-policies.js # 50-state telehealth policy dataset
│
└── icons/
    ├── icon-192.svg           # PWA icon
    └── icon-512.svg           # PWA icon
```

---

## Roadmap

### Tier 2: Policy Change Alert Subscriptions (Ready to Start)

**Goal**: Proactive notifications when telehealth regulations change.

#### Data Sources
- **CCHP (Center for Connected Health Policy)**: State-by-state telehealth policy tracker
- **AANP (American Association of Nurse Practitioners)**: NP practice authority changes
- **NCSBN (National Council of State Boards of Nursing)**: NLC and APRN Compact updates
- **CMS**: Federal telehealth policy updates

#### Implementation Plan
1. **RSS/Email Monitoring**: Subscribe to CCHP, AANP, NCSBN newsletters
2. **Google Alerts**: Targeted alerts for telehealth + NP + state legislation
3. **Quarterly Review Calendar**: Full 50-state reviews (Jan, Apr, Jul, Oct)
4. **Change Log Sheet**: `v2_policy_changelog` tab with audit trail

**Estimated Effort**: ~4 hrs setup + 2 hrs/quarter

---

### Tier 3: AI-Assisted Policy Monitoring (Future)

**Goal**: Semi-automated policy detection using Apps Script + LLM API.

```
[Scheduled Trigger (Apps Script)]
        |
        v
[Web Scraper / RSS Fetcher]
        |
        v
[LLM Analysis (Claude API)]
  - Extract structured policy changes
  - Compare against current data
  - Generate change summary + confidence score
        |
        v
[Draft Updates → Admin Review → Approve/Reject]
```

**Estimated Effort**: ~20-25 hours total across 4 phases

---

### Future Enhancements (Backlog)

| Feature | Priority | Effort |
|---|---|---|
| Notification center (in-app alerts for expirations, overdue tasks) | High | 4-6 hrs |
| Provider document vault (file upload to Google Drive) | Medium | 6-8 hrs |
| Credentialing timeline view (Gantt-style per application) | Medium | 6-8 hrs |
| Multi-user access with roles (admin, viewer, editor) | Medium | 8-10 hrs |
| Automated re-credentialing reminders (based on payer cycles) | Medium | 4-6 hrs |
| Payer portal link integration (deep links to payer sites) | Low | 2-3 hrs |
| Dashboard KPI email digest (weekly summary via Apps Script) | Low | 3-4 hrs |
| Custom report builder (select fields, filters, export) | Low | 6-8 hrs |
| Audit log for all data changes (who changed what, when) | Low | 4-6 hrs |
| Dark mode theme toggle | Low | 2-3 hrs |

---

*Last updated: 2026-03-11*
