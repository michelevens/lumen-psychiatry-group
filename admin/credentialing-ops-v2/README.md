# EnnHealth Credentialing Ops v2

Internal credentialing operations platform for a telehealth psychiatry practice. Manages provider enrollment, payer credentialing workflows, CAQH profile maintenance, and operational reporting — all from a single browser-based dashboard with offline support.

**No framework dependencies.** Pure vanilla JavaScript with ES modules.

## Tech Stack

- **Vanilla JS** — ES modules, no bundler, no build step
- **CSS Custom Properties** — theming and layout
- **Chart.js** — dashboard analytics and reporting charts
- **Google Sheets** — cloud data store via Apps Script backend
- **Service Worker + manifest.json** — installable PWA with offline support

## Architecture

```
credentialing-ops-v2/
├── index.html              # Entry point + access-code auth gate
├── sw.js                   # Service Worker (caching / offline)
├── manifest.json           # PWA manifest
├── core/                   # Business logic
│   ├── store.js            # State management + localStorage persistence
│   ├── config.js           # App configuration + environment settings
│   ├── workflow.js          # Credentialing workflow engine
│   ├── batch-generator.js   # Batch application generation
│   ├── email-generator.js   # Templated email composition
│   ├── migration.js         # Data migration utilities
│   └── caqh-api.js          # CAQH ProView API integration
├── data/                   # Static datasets
│   ├── schema.js           # Data model definitions
│   ├── payers.js           # Insurance payer directory
│   ├── states.js           # State licensing & telehealth rules
│   ├── providers.js        # Provider roster
│   ├── strategies.js       # Enrollment strategy templates
│   └── telehealth-policies.js  # Payer telehealth policy reference
└── ui/                     # Presentation layer
    ├── app.js              # UI rendering, routing, event handling
    └── styles.css          # All styles (CSS custom properties)
```

## Features

**13 sidebar pages:** Dashboard, Providers, Payers, Applications, Tasks, CAQH Profiles, State Licenses, DEA/CSR, Malpractice, Document Vault, Compliance Calendar, Reports, Settings

**12 tools (dropdown):** Batch Application Generator, Email Generator, Credential Verification, Payer Enrollment Lookup, Telehealth Policy Checker, License Expiry Tracker, CAQH Auto-Attestation, Fee Schedule Analyzer, Network Adequacy Report, Delegation Grid, Audit Trail Export, Data Migration

## Data Flow

```
localStorage (cache-first)
       ↕ read/write
   store.js ──── async sync ────→ Google Sheets (via Apps Script)
```

All reads hit localStorage first for instant UI. Writes persist locally, then sync to Google Sheets in the background. Conflicts resolve with last-write-wins.

## Setup

1. **Clone / download** the repo
2. **Serve static files** — any HTTP server works:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. **Deploy the Apps Script backend** (in the linked Google Sheet) for cloud sync
4. Update `core/config.js` with your Apps Script deployment URL

No build step. No `npm install` required for the frontend.

## Auth

Session-based access code gate in `index.html`. Users enter a shared access code to unlock the app. The session persists in `sessionStorage` and clears on tab close.

## License

Private — internal use only.
