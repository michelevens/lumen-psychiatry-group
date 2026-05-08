# EnnHealth Psychiatry — SEO Implementation Plan

> **Last updated:** 2026-03-03 (session 2)
> **Total site pages:** 52 files (44 HTML + JS/XML/JSON)
> **Sitemap URLs:** 41
> **Google indexed:** 1 of 41 (homepage only — fixes deployed, awaiting re-crawl)

## Current State (Post-Implementation)

**Completed across 6 sessions (9f56ce8 → 7fb45f2):**
- 44+ pages with unique titles, meta descriptions, canonical URLs
- Extensive structured data: MedicalBusiness, MedicalCondition, FAQPage, Article, BreadcrumbList, HowTo, Review, CollectionPage, Physician, WebSite, MedicalClinic, Service/Offer
- Open Graph + Twitter Card metadata on every page
- sitemap.xml (41 URLs) + robots.txt configured
- Geo-targeting meta tags (Clermont, FL coordinates)
- PWA manifest with proper icons
- Blog with 12 articles, all with Article schema + FAQ schema
- 8 condition treatment pages with MedicalWebPage schema + cross-links + "Helpful Articles" sections
- 10 state location pages with unique content + "Helpful Resources" sections
- Locations index hub page (`/locations/`) with CollectionPage schema
- About/provider page (`/about/`) with Physician schema (E-E-A-T)
- WebP images with `<picture>` fallbacks (76-82% smaller)
- Explicit `width`/`height` on all `<img>` tags (CLS prevention)
- Standalone FAQ page with 20 questions + structured data
- Custom 404 page
- Internal cross-linking: condition pages, blog "Related Reading" sections, location→condition links
- hreflang tags fixed (each page references its own URL, not homepage)
- Google Analytics 4 (`G-XKV341Q96S`) on all 46 pages + conversion event tracking
- Google Search Console verified, sitemap submitted (41 pages discovered)
- CSP updated to allow GA4 tracking domains

---

## Phase 1: Technical SEO — COMPLETED (a628a9a)

### 1.1 Page Speed & Core Web Vitals
- [x] `defer` added to mobile-app.js (25 pages) and main.js (homepage)
- [x] WebP image conversion with `<picture>` fallbacks (f8dee75)
  - logo-1080: 1215KB → 286KB (76% smaller)
  - logo-512: 796KB → 216KB (73% smaller)
  - logo-wide: 448KB → 81KB (82% smaller)
  - logo-192: 298KB → 60KB (80% smaller)
  - logo-48: 43KB → 15KB (66% smaller)
- [x] WebP preload hint on homepage
- [x] shared-header.js `<picture>` element (covers all 30+ subpages)
- [x] Add explicit `width` and `height` to all `<img>` tags (prevents CLS) — (7702edf)
- [ ] Minify styles.css and main.js for production

### 1.2 Missing Meta Tags & Headers
- [x] `hreflang="en-us"` added to all 26 public pages
- [x] **hreflang bug fixed** — 28 pages had hreflang pointing to `https://ennhealth.com/` instead of their own URL; now each page references its own canonical URL (0760eae)
- [x] `<meta name="language" content="English">` added to all pages
- [x] Every page verified to have exactly one `<h1>` tag

### 1.3 Custom 404 Page
- [x] `/404.html` created with EnnHealth branding, popular links, booking CTAs

### 1.4 Sitemap Updates
- [x] All condition pages in sitemap (including alcohol-use)
- [x] All lastmod dates refreshed to 2026-03-03
- [x] 10 location pages added to sitemap
- [x] FAQ page added to sitemap
- [x] Submit sitemap to Google Search Console — submitted, 41 pages discovered (Status: Success)

### 1.5 Internal Linking Improvements
- [x] "Related Conditions" cross-link sections on all 8 condition pages
- [x] Blog link added to site-wide shared header navigation
- [x] Location pages link to each other via "related states" section
- [x] FAQ page links to condition pages, genetic testing, policies, booking
- [x] "Related Reading" sections on all 12 blog posts (2-4 links each to other posts + condition pages) — (5404788)
- [x] "Helpful Resources" sections on all 10 location pages (blog + FAQ links) — (5404788)
- [x] "Helpful Articles" sections on 6 condition pages (depression, PTSD, bipolar, OCD, insomnia, alcohol-use) — (5404788)
- [x] Locations index hub page `/locations/` linking all 10 states + condition pages — (7fb45f2)
- [x] About/provider page `/about/` linking condition pages, locations, blog, FAQ — (7fb45f2)

---

## Phase 2: Content SEO — PARTIALLY COMPLETED

### 2.1 Service Area Pages (Location-Based SEO) — COMPLETED (80287f8)

10 state pages created (only states with active licenses, excluding TX/CA pending prescription clarification):

| # | State | URL | Unique Angle |
|---|-------|-----|-------------|
| 1 | **Florida** | `/locations/florida/` | Home state, in-person + telehealth, facility services |
| 2 | **New York** | `/locations/new-york/` | NYC 67-day avg wait times, upstate shortages |
| 3 | **Virginia** | `/locations/virginia/` | Military communities (Norfolk, Pentagon), Tricare |
| 4 | **Maryland** | `/locations/maryland/` | DC metro commuter demand, Baltimore disparities |
| 5 | **Massachusetts** | `/locations/massachusetts/` | Boston hospital waits, 500K+ student population |
| 6 | **Colorado** | `/locations/colorado/` | Top 10 suicide rate, mountain community gaps |
| 7 | **Arizona** | `/locations/arizona/` | Fastest-growing metro, senior + tribal communities |
| 8 | **Washington** | `/locations/washington/` | Tech burnout, telehealth parity law (RCW 48.43.735) |
| 9 | **Connecticut** | `/locations/connecticut/` | Wealth/poverty disparities, NYC commuter stress |
| 10 | **Nevada** | `/locations/nevada/` | 51st-ranked MH access, service industry shift workers |

Each page has:
- Unique prose (not template fill-ins)
- State-specific mental health statistics
- 3 JSON-LD schemas: MedicalBusiness (areaServed), BreadcrumbList, FAQPage
- 5 state-specific FAQ questions
- Services grid (8 services)
- Insurance grid (10 accepted plans)
- Areas served (cities/regions by area)
- Cross-links to other 9 state pages
- Consistent design matching condition pages

**Not created (pending):**
- Texas — prescription regulations need clarification
- California — prescription regulations need clarification
- Additional states can be added later following same template

### 2.2 Blog Content Strategy — PARTIALLY COMPLETED (1f5a4c2)

**Current:** 12 blog posts. **Target:** 20+ posts.

**Completed Blog Posts (4 new, 2026-03-03):**
- [x] "Signs you need to see a psychiatric provider" → `/blog/signs-you-need-psychiatrist`
- [x] "Psychiatric provider vs therapist" → `/blog/psychiatrist-vs-therapist`
- [x] "Can a nurse practitioner prescribe psychiatric medication?" → `/blog/can-nurse-practitioner-prescribe`
- [x] "What happens during a medication management appointment?" → `/blog/medication-management-appointment`

**Remaining Blog Topics:**
- [ ] "How to find a psychiatrist who takes my insurance"
- [ ] "Telehealth psychiatry for anxiety — what to expect"
- [ ] "How long does it take for antidepressants to work?"
- [ ] "Online psychiatry vs in-person: pros and cons"
- [ ] "Managing ADHD without medication"
- [ ] "Bipolar disorder vs depression: how to tell the difference"
- [ ] "Telehealth psychiatry for veterans and military families"
- [ ] "Sleep hygiene tips from a psychiatrist"

### 2.3 FAQ Expansion — PARTIALLY COMPLETED
- [x] Standalone `/faq/` page with 20 FAQs across 5 categories + structured data
- [ ] Expand condition page FAQs from 5 to 7-10 each

---

## Phase 3: Local SEO — COMPLETED (manual, non-code)

### 3.1 Google Business Profile — DONE
- [x] Claimed and verified

### 3.2 Directory Listings — DONE
- [x] Submitted to major directories

### 3.3 Review Strategy
- [ ] Add review collection to patient flow (post-appointment email)
- [ ] Display Google reviews widget on homepage
- [ ] Keep aggregateRating schema updated as reviews grow (currently 6 reviews / 5.0)

---

## Phase 4: Technical Enhancements — MOSTLY COMPLETED

### 4.0 New Pages Created (7fb45f2)

| Page | URL | Schemas | Purpose |
|------|-----|---------|---------|
| **Locations Hub** | `/locations/` | CollectionPage, BreadcrumbList | Hub linking all 10 state pages + 16 coming-soon states |
| **About / Provider** | `/about/` | Physician, BreadcrumbList | E-E-A-T: Dr. Nageley Michel credentials, philosophy, certifications |

### 4.1 Schema Enhancements — COMPLETED (80287f8)

| Schema Type | Page | Status |
|------------|------|--------|
| MedicalBusiness | Homepage | Already existed |
| Physician | Homepage | Already existed |
| FAQPage | Homepage + all conditions + FAQ page | Already existed |
| WebSite | Homepage | Already existed |
| MedicalClinic + Service/Offer | Homepage (with DPC pricing) | Already existed |
| BreadcrumbList | All pages | Already existed |
| **HowTo** | Homepage "How It Works" | **Added (80287f8)** |
| **Review** (individual) | Homepage testimonials (6 reviews) | **Added (80287f8)** |
| **CollectionPage** | Blog index (8 articles in ItemList) | **Added (80287f8)** |
| MedicalBusiness (state) | 10 location pages | **Added (80287f8)** |
| FAQPage (state) | 10 location pages | **Added (80287f8)** |
| **CollectionPage** | Locations hub (`/locations/`) | **Added (7fb45f2)** |
| **Physician** | About page (`/about/`) | **Added (7fb45f2)** |

### 4.2 Open Graph Improvements
- [ ] Create unique 1200x630 OG images per condition page (requires Canva/Figma)
- [ ] Add `og:image:width` and `og:image:height` to all subpages

### 4.3 Accessibility = SEO
- [ ] Lighthouse accessibility audit (aim for 90+)
- [ ] Audit all `<a>` tags for descriptive anchor text
- [ ] Ensure all interactive elements have ARIA labels

### 4.4 URL Structure
- [ ] Ensure policy pages resolve with and without trailing slash

---

## Phase 5: Off-Page SEO — ONGOING (non-code)

### 5.1 Backlink Strategy
- [ ] Guest post on mental health blogs
- [ ] HARO / Help a Reporter Out contributions
- [ ] Insurance company provider directory listings
- [ ] Shareable infographics (e.g., "Signs of Adult ADHD")

### 5.2 Social Signals
- [ ] Share blog posts on LinkedIn, Facebook, Instagram
- [ ] Short-form video content for YouTube
- [ ] Repurpose blog posts as social carousels

---

## Phase 6: Monitoring & Measurement — COMPLETED

### 6.1 Setup
- [x] Google Search Console — verified, sitemap submitted (41 pages discovered, Status: Success)
- [x] Google Analytics 4 — `G-XKV341Q96S` added to all 46 HTML pages (2c51b76)
- [x] CSP updated to allow `www.googletagmanager.com`, `www.google-analytics.com`, `analytics.google.com` (0ee5398)
- [x] Conversion tracking via `ga-events.js` (2c51b76):
  - `phone_click` — tracks `tel:` link clicks
  - `book_appointment` — tracks `#book` / `.nav-cta` clicks
  - `intake_start` — fires on `/intake` page load
  - `intake_click` — tracks `/intake` link clicks from other pages
- [x] Key events configured in GA4: phone_click, book_appointment, intake_start

### 6.2 Monthly SEO Tasks
- [ ] Publish 2-4 new blog posts per month
- [ ] Update existing content with fresh stats
- [ ] Review Search Console for keyword opportunities
- [ ] Check for crawl errors
- [ ] Update sitemap lastmod dates after content changes

---

## Implementation History

| Date | Commit | Work Done |
|------|--------|-----------|
| 2026-03-02 | `9f56ce8` | Created comprehensive SEO plan |
| 2026-03-03 | `a628a9a` | **Phase 1:** defer scripts, hreflang/language meta, custom 404, blog nav link, related conditions cross-links on 8 pages, standalone FAQ page (20 Qs), sitemap updates |
| 2026-03-03 | `80287f8` | **Phase 2+4:** 10 state location pages (FL, NY, VA, MD, MA, CO, AZ, WA, CT, NV), HowTo schema, Review schema, CollectionPage schema, sitemap + footer updates |
| 2026-03-03 | `f8dee75` | **WebP:** Converted 5 logo PNGs to WebP (76-82% savings), `<picture>` fallbacks in shared-header.js + homepage + admin |
| 2026-03-03 | `1f5a4c2` | **Blog expansion:** 4 new posts (signs-you-need-psychiatrist, psychiatrist-vs-therapist, can-nurse-practitioner-prescribe, medication-management-appointment), blog index updated (12 articles), sitemap updated (39 URLs) |
| 2026-03-03 | `7702edf` | **CLS fix:** Added explicit `width`/`height` to all `<img>` tags across homepage, admin, shared-header |
| 2026-03-03 | `2c51b76` | **GA4 + Events:** Added Google Analytics 4 (`G-XKV341Q96S`) to all 46 HTML pages, created `ga-events.js` for conversion tracking (phone_click, book_appointment, intake_start, intake_click) |
| 2026-03-03 | `0ee5398` | **CSP fix:** Updated Content Security Policy on all 46 pages to allow `www.googletagmanager.com`, `www.google-analytics.com`, `analytics.google.com` |
| 2026-03-03 | `0760eae` | **hreflang fix:** Fixed 28 pages where hreflang pointed to homepage instead of own canonical URL — likely caused Google indexing suppression |
| 2026-03-03 | `5404788` | **Internal linking:** "Related Reading" on 12 blog posts, "Helpful Resources" on 10 location pages, "Helpful Articles" on 6 condition pages (27 files, 270 insertions) |
| 2026-03-03 | `7fb45f2` | **New pages:** Locations index hub (`/locations/`), About/provider page (`/about/`), sitemap updated (41 URLs) |
| 2026-03-03 | `57d8cdb` | **Credentialing tracker fix:** TDZ error — moved auto-auth check after variable declarations |
| 2026-03-03 | `ff9efef` | **Credentialing tracker:** Date format fix (MM/DD/YYYY display), cloud sync reliability (15s timeout, retry counter, retry button) |
| 2026-03-03 | `08183b1` | **Mobile menu fix:** Replaced display:none toggling with visibility/pointer-events for smooth slide animation |
| 2026-03-03 | `95fc6aa` | **Credentialing tracker:** Fixed credType and providerId not persisting (cloud data was overwriting local-only fields) |
| 2026-03-03 | `44bfeb5` | **Payer logos:** Created 27 branded SVG badges with brand colors, added to homepage insurance section + credentialing tracker |

---

## Target Keywords by Page

| Page | Primary Keyword | Secondary Keywords |
|------|----------------|-------------------|
| Homepage | online psychiatrist | telehealth psychiatry, virtual mental health, psychiatric care online |
| /adhd/ | ADHD treatment online | adult ADHD evaluation, ADHD psychiatrist telehealth |
| /anxiety/ | anxiety treatment online | anxiety psychiatrist telehealth, panic disorder treatment |
| /depression/ | depression treatment online | online psychiatrist depression, antidepressant management |
| /ptsd/ | PTSD treatment online | trauma therapy telehealth, PTSD psychiatrist |
| /bipolar/ | bipolar disorder treatment online | bipolar psychiatrist, mood stabilizer management |
| /ocd/ | OCD treatment online | ERP therapy online, OCD psychiatrist |
| /insomnia/ | insomnia treatment online | CBT-I telehealth, sleep disorder psychiatrist |
| /alcohol-use/ | alcohol use disorder treatment | AUD treatment online, naltrexone telehealth |
| /genetic-testing/ | pharmacogenomic testing psychiatry | genetic testing mental health medication |
| /blog/ | mental health blog | psychiatry articles, mental health education |
| /faq/ | telehealth psychiatry FAQ | online psychiatrist questions, mental health FAQ |
| /locations/florida/ | psychiatrist in Florida | online psychiatrist Florida, telehealth FL |
| /locations/new-york/ | psychiatrist in New York | online psychiatrist NY, telehealth NYC |
| /locations/virginia/ | psychiatrist in Virginia | online psychiatrist VA, telehealth Virginia |
| /locations/maryland/ | psychiatrist in Maryland | online psychiatrist MD, telehealth Baltimore |
| /locations/massachusetts/ | psychiatrist in Massachusetts | online psychiatrist MA, telehealth Boston |
| /locations/colorado/ | psychiatrist in Colorado | online psychiatrist CO, telehealth Denver |
| /locations/arizona/ | psychiatrist in Arizona | online psychiatrist AZ, telehealth Phoenix |
| /locations/washington/ | psychiatrist in Washington | online psychiatrist WA, telehealth Seattle |
| /locations/connecticut/ | psychiatrist in Connecticut | online psychiatrist CT, telehealth Hartford |
| /locations/nevada/ | psychiatrist in Nevada | online psychiatrist NV, telehealth Las Vegas |
| **/locations/** | telehealth psychiatry states | online psychiatrist states, virtual psychiatry locations |
| **/about/** | EnnHealth psychiatry provider | about Dr. Nageley Michel, PMHNP-BC credentials |

---

## Next Actions (Prioritized)

### HIGH PRIORITY — Code Changes (Next Session)
1. **Write 8 new blog posts** (12 → 20 total) targeting long-tail keywords:
   - [ ] "How to find a psychiatrist who takes your insurance"
   - [ ] "Telehealth psychiatry for anxiety — what to expect"
   - [ ] "How long does it take for antidepressants to work?"
   - [ ] "Online psychiatry vs in-person: pros and cons"
   - [ ] "Managing ADHD without medication"
   - [ ] "Bipolar disorder vs depression: how to tell the difference"
   - [ ] "Telehealth psychiatry for veterans and military families"
   - [ ] "Sleep hygiene tips from a psychiatric provider"
2. **Expand condition page FAQs** from 5 to 8-10 each (more featured snippet opportunities)
3. **Update blog index + sitemap** after new posts are written

### HIGH PRIORITY — Manual Actions (Do Now)
1. **Request indexing in Google Search Console** — URL Inspection → paste each URL → "Request Indexing":
   - Start with: `/adhd/`, `/anxiety/`, `/depression/`, `/blog/`, `/locations/`, `/about/`, `/faq/`
   - Then blog posts over next few days (limit ~10/day)
2. **Create directory listings** (biggest backlink impact for a new site):
   - Psychology Today (~$30/mo) — ranks for everything in this niche
   - Healthgrades (free) — high domain authority
   - Zocdoc (free for patients)
   - Vitals.com (free)
   - WebMD Provider Directory (free)
   - NAP: EnnHealth Psychiatry, 1230 Okaley Seaver Dr Suite 101, Clermont FL 34711, (407) 796-2406
3. **Google Business Profile optimization** — add all 8 service categories, set service areas to 10 states, post weekly

### MEDIUM PRIORITY
- [ ] Minify styles.css and main.js for production
- [ ] Create unique 1200×630 OG images per condition page
- [ ] Lighthouse accessibility audit (aim for 90+)
- [ ] Collect more Google reviews (target 20+)

### LOW PRIORITY
- [ ] Guest post on mental health blogs
- [ ] Shareable infographics
- [ ] Short-form video content
- [ ] Ensure policy pages resolve with/without trailing slash

---

## File Structure (Post-SEO)

```
ennhealth-psychiatry/
├── index.html                    # Homepage (7 JSON-LD schemas)
├── 404.html                      # Custom 404
├── sitemap.xml                   # 41 URLs
├── robots.txt
├── manifest.json
├── styles.css                    # Main stylesheet
├── main.js                       # Homepage JS
├── shared-header.js              # Unified nav (WebP logo)
├── mobile-app.js                 # Bottom nav + floating CTA
├── ga-events.js                  # GA4 conversion event tracking (phone, booking, intake)
├── SEO-PLAN.md                   # This file
├── assets/
│   ├── images/
│   │   ├── logo-*.png            # Original PNGs (kept for fallback)
│   │   ├── logo-*.webp           # WebP versions (76-82% smaller)
│   │   └── favicon-*.png
│   └── logos/payers/             # 27 branded SVG badges (brand colors)
│       ├── aetna.svg, bcbs.svg, cigna.svg, unitedhealth.svg, ...
│       └── (used on homepage + credentialing tracker)
├── adhd/index.html               # 8 condition pages
├── anxiety/index.html            #   (each with MedicalWebPage schema,
├── depression/index.html         #    related conditions cross-links,
├── ptsd/index.html               #    5 FAQs, booking CTAs)
├── bipolar/index.html
├── ocd/index.html
├── insomnia/index.html
├── alcohol-use/index.html
├── genetic-testing/index.html    # Pharmacogenomics service page
├── about/index.html              # Provider page (Physician schema, E-E-A-T)
├── faq/index.html                # 20 FAQs, 5 categories, structured data
├── blog/
│   ├── index.html                # Blog index (CollectionPage schema, 12 articles)
│   ├── signs-you-need-psychiatrist.html      # NEW (1f5a4c2)
│   ├── psychiatrist-vs-therapist.html        # NEW (1f5a4c2)
│   ├── can-nurse-practitioner-prescribe.html # NEW (1f5a4c2)
│   ├── medication-management-appointment.html # NEW (1f5a4c2)
│   ├── first-psychiatric-evaluation.html
│   ├── telehealth-psychiatry-how-it-works.html
│   ├── adult-adhd-signs.html
│   ├── anxiety-treatment-without-benzos.html
│   ├── insurance-vs-direct-care.html
│   ├── what-is-a-pmhnp.html
│   ├── prepare-for-telehealth-appointment.html
│   └── non-stimulant-adhd-medications.html
├── locations/
│   ├── index.html                # Locations hub (CollectionPage schema, links all 10 states)
│   ├── florida/index.html        # 10 state location pages
│   ├── new-york/index.html       #   (each with MedicalBusiness schema,
│   ├── virginia/index.html       #    BreadcrumbList, FAQPage,
│   ├── maryland/index.html       #    unique state content,
│   ├── massachusetts/index.html  #    5 state-specific FAQs,
│   ├── colorado/index.html       #    services + insurance grids,
│   ├── arizona/index.html        #    cross-links to other states)
│   ├── washington/index.html
│   ├── connecticut/index.html
│   └── nevada/index.html
├── privacy.html                  # Legal pages
├── terms.html
├── telehealth-consent.html
├── cancellation-policy.html
├── communications-consent.html
├── intake.html                   # New patient forms
├── review.html                   # Review submission
├── admin.html                    # Internal admin
└── admin/                        # Admin tools
    ├── credentialing-setup.html
    ├── credentialing-tracker.html
    └── license-tracker.html
```
