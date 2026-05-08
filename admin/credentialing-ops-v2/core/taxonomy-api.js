/**
 * EnnHealth Credentialing Ops v2 — NPPES NPI Registry & Taxonomy API
 *
 * Free public API from CMS — no auth required.
 * https://npiregistry.cms.hhs.gov/api-page
 *
 * Browser requests are proxied through Google Apps Script to avoid CORS.
 * The Apps Script handler fetches from NPPES server-side and returns the JSON.
 *
 * Provides:
 *   - NPI lookup (by number)
 *   - Provider search (by name, state, taxonomy)
 *   - Taxonomy code search/browse
 */

import { CONFIG } from './config.js';

const NPPES_BASE = 'https://npiregistry.cms.hhs.gov/api/?version=2.1';

// ─── NPI Lookup ───

/**
 * Look up a single provider by NPI number.
 * Returns the full NPPES record or null.
 */
export async function lookupNPI(npi) {
  if (!npi || !/^\d{10}$/.test(npi.trim())) {
    throw new Error('NPI must be a 10-digit number');
  }
  const url = `${NPPES_BASE}&number=${npi.trim()}`;
  const data = await _fetch(url);
  if (data.result_count === 0) return null;
  return _parseProvider(data.results[0]);
}

// ─── Provider Search ───

/**
 * Search NPPES by name, state, city, taxonomy description.
 * Returns array of parsed provider records (max 200).
 */
export async function searchProviders({ firstName, lastName, state, city, taxonomyDesc, postalCode, limit = 50 } = {}) {
  const params = [];
  if (firstName) params.push(`first_name=${encodeURIComponent(firstName.trim())}`);
  if (lastName) params.push(`last_name=${encodeURIComponent(lastName.trim())}`);
  if (state) params.push(`state=${encodeURIComponent(state.trim())}`);
  if (city) params.push(`city=${encodeURIComponent(city.trim())}`);
  if (postalCode) params.push(`postal_code=${encodeURIComponent(postalCode.trim())}`);
  if (taxonomyDesc) params.push(`taxonomy_description=${encodeURIComponent(taxonomyDesc.trim())}`);
  params.push(`limit=${Math.min(limit, 200)}`);
  params.push('enumeration_type=NPI-1'); // Individual providers only

  if (params.length <= 2) {
    throw new Error('Provide at least one search criterion (name, state, taxonomy, etc.)');
  }

  const url = `${NPPES_BASE}&${params.join('&')}`;
  const data = await _fetch(url);
  return (data.results || []).map(_parseProvider);
}

/**
 * Search NPPES by taxonomy description keyword.
 * Useful for finding providers by specialty.
 */
export async function searchByTaxonomy(keyword, { state, limit = 50 } = {}) {
  if (!keyword || keyword.trim().length < 2) {
    throw new Error('Taxonomy search requires at least 2 characters');
  }
  const params = [
    `taxonomy_description=${encodeURIComponent(keyword.trim())}`,
    `limit=${Math.min(limit, 200)}`,
  ];
  if (state) params.push(`state=${encodeURIComponent(state)}`);

  const url = `${NPPES_BASE}&${params.join('&')}`;
  const data = await _fetch(url);
  return (data.results || []).map(_parseProvider);
}

// ─── Taxonomy Code Reference ───

/**
 * Common NUCC taxonomy codes for behavioral health / psychiatric providers.
 * Source: https://taxonomy.nucc.org/
 */
export const TAXONOMY_CODES = [
  // Physician
  { code: '2084P0800X', type: 'Physician', specialty: 'Psychiatry', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084P0802X', type: 'Physician', specialty: 'Addiction Psychiatry', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084P0804X', type: 'Physician', specialty: 'Child & Adolescent Psychiatry', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084P0805X', type: 'Physician', specialty: 'Geriatric Psychiatry', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084N0600X', type: 'Physician', specialty: 'Neurology', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084F0202X', type: 'Physician', specialty: 'Forensic Psychiatry', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084S0010X', type: 'Physician', specialty: 'Sports Medicine (Psychiatry)', classification: 'Allopathic & Osteopathic Physicians' },
  { code: '2084B0002X', type: 'Physician', specialty: 'Obesity Medicine (Psychiatry)', classification: 'Allopathic & Osteopathic Physicians' },
  // Nurse Practitioner
  { code: '363LP0808X', type: 'Nurse Practitioner', specialty: 'Psychiatric/Mental Health', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LP0200X', type: 'Nurse Practitioner', specialty: 'Pediatrics', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LA2200X', type: 'Nurse Practitioner', specialty: 'Adult Health', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LF0000X', type: 'Nurse Practitioner', specialty: 'Family', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LG0600X', type: 'Nurse Practitioner', specialty: 'Gerontology', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LC0200X', type: 'Nurse Practitioner', specialty: 'Critical Care Medicine', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LN0005X', type: 'Nurse Practitioner', specialty: 'Neonatal', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LX0001X', type: 'Nurse Practitioner', specialty: 'Obstetrics & Gynecology', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '363LP0222X', type: 'Nurse Practitioner', specialty: 'Pediatrics, Critical Care', classification: 'Physician Assistants & Advanced Practice Nursing' },
  // Physician Assistant
  { code: '363AM0700X', type: 'Physician Assistant', specialty: 'Medical', classification: 'Physician Assistants & Advanced Practice Nursing' },
  // Clinical Nurse Specialist
  { code: '364SP0808X', type: 'Clinical Nurse Specialist', specialty: 'Psychiatric/Mental Health', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '364SP0809X', type: 'Clinical Nurse Specialist', specialty: 'Psych/MH, Adult', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '364SP0810X', type: 'Clinical Nurse Specialist', specialty: 'Psych/MH, Child & Adolescent', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '364SP0811X', type: 'Clinical Nurse Specialist', specialty: 'Psych/MH, Chronically Ill', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '364SP0812X', type: 'Clinical Nurse Specialist', specialty: 'Psych/MH, Community', classification: 'Physician Assistants & Advanced Practice Nursing' },
  { code: '364SP0813X', type: 'Clinical Nurse Specialist', specialty: 'Psych/MH, Geropsychiatric', classification: 'Physician Assistants & Advanced Practice Nursing' },
  // Psychologist
  { code: '103T00000X', type: 'Psychologist', specialty: 'Psychologist', classification: 'Behavioral Health & Social Service' },
  { code: '103TC0700X', type: 'Psychologist', specialty: 'Clinical', classification: 'Behavioral Health & Social Service' },
  { code: '103TC2200X', type: 'Psychologist', specialty: 'Clinical Child & Adolescent', classification: 'Behavioral Health & Social Service' },
  { code: '103TP2701X', type: 'Psychologist', specialty: 'Psychoanalysis', classification: 'Behavioral Health & Social Service' },
  // Social Worker
  { code: '1041C0700X', type: 'Clinical Social Worker', specialty: 'Clinical', classification: 'Behavioral Health & Social Service' },
  // Counselor
  { code: '101YM0800X', type: 'Counselor', specialty: 'Mental Health', classification: 'Behavioral Health & Social Service' },
  { code: '101YA0400X', type: 'Counselor', specialty: 'Addiction (Substance Use Disorder)', classification: 'Behavioral Health & Social Service' },
  { code: '101YP1600X', type: 'Counselor', specialty: 'Pastoral', classification: 'Behavioral Health & Social Service' },
  { code: '101YP2500X', type: 'Counselor', specialty: 'Professional', classification: 'Behavioral Health & Social Service' },
  // Marriage & Family Therapist
  { code: '106H00000X', type: 'Marriage & Family Therapist', specialty: 'Marriage & Family Therapist', classification: 'Behavioral Health & Social Service' },
  // Behavioral Analyst
  { code: '103K00000X', type: 'Behavioral Analyst', specialty: 'Behavioral Analyst', classification: 'Behavioral Health & Social Service' },
  // Registered Nurse
  { code: '163WP0808X', type: 'Registered Nurse', specialty: 'Psychiatric/Mental Health', classification: 'Nursing Service Providers' },
  // Peer Specialist
  { code: '172V00000X', type: 'Community Health Worker', specialty: 'Community Health Worker', classification: 'Other Service Providers' },
  // Telehealth
  { code: '261QM2500X', type: 'Clinic/Center', specialty: 'Mental Health (Including Community MHC)', classification: 'Ambulatory Health Care Facilities' },
  { code: '261QM0801X', type: 'Clinic/Center', specialty: 'Mental Health, Child', classification: 'Ambulatory Health Care Facilities' },
  { code: '283Q00000X', type: 'Psychiatric Hospital', specialty: 'Psychiatric Hospital', classification: 'Hospitals' },
  // Group practice
  { code: '193200000X', type: 'Group', specialty: 'Multi-Specialty Group', classification: 'Group' },
  { code: '193400000X', type: 'Group', specialty: 'Single Specialty Group', classification: 'Group' },
];

/**
 * Search taxonomy codes by keyword (matches code, type, specialty, classification).
 */
export function searchTaxonomyCodes(query) {
  if (!query || query.trim().length < 2) return TAXONOMY_CODES;
  const q = query.toLowerCase().trim();
  return TAXONOMY_CODES.filter(t =>
    t.code.toLowerCase().includes(q) ||
    t.type.toLowerCase().includes(q) ||
    t.specialty.toLowerCase().includes(q) ||
    t.classification.toLowerCase().includes(q)
  );
}

// ─── Internal Helpers ───

async function _fetch(url) {
  // Route through Apps Script proxy to avoid CORS blocking.
  // The proxy fetches the NPPES URL server-side and returns the JSON.
  if (CONFIG.APPS_SCRIPT_URL) {
    try {
      const body = {
        action: 'nppes_proxy',
        url: url,
      };
      const proxyResp = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
        redirect: 'follow',
      });
      if (!proxyResp.ok) throw new Error(`Proxy HTTP ${proxyResp.status}`);
      const text = await proxyResp.text();
      const proxyResult = JSON.parse(text);
      if (proxyResult.success === false) throw new Error(proxyResult.error || 'Proxy error');
      // The proxy returns the NPPES data in proxyResult.data
      const data = proxyResult.data || proxyResult;
      if (data.Errors && data.Errors.length > 0) {
        throw new Error(data.Errors.map(e => e.description || e.field).join('; '));
      }
      return data;
    } catch (proxyErr) {
      console.warn('Apps Script proxy failed, trying direct fetch:', proxyErr);
      // Fall through to direct fetch as fallback
    }
  }

  // Direct fetch (works if CORS is allowed or in non-browser environments)
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`NPPES API error: HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.Errors && data.Errors.length > 0) {
    throw new Error(data.Errors.map(e => e.description || e.field).join('; '));
  }
  return data;
}

function _parseProvider(result) {
  const basic = result.basic || {};
  const taxonomies = result.taxonomies || [];
  const addresses = result.addresses || [];
  const practiceAddr = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0] || {};
  const mailingAddr = addresses.find(a => a.address_purpose === 'MAILING') || {};
  const primaryTax = taxonomies.find(t => t.primary) || taxonomies[0] || {};

  return {
    npi: result.number,
    entityType: result.enumeration_type === 'NPI-1' ? 'individual' : 'organization',
    firstName: basic.first_name || '',
    lastName: basic.last_name || '',
    middleName: basic.middle_name || '',
    prefix: basic.name_prefix || '',
    suffix: basic.name_suffix || '',
    credential: basic.credential || '',
    gender: basic.gender || '',
    status: basic.status === 'A' ? 'Active' : basic.status || '',
    lastUpdated: basic.last_updated || '',
    enumerationDate: basic.enumeration_date || '',
    // Organization fields
    orgName: basic.organization_name || '',
    orgNpi: basic.organizational_subpart === 'YES' ? result.number : '',
    // Taxonomy
    taxonomyCode: primaryTax.code || '',
    taxonomyDesc: primaryTax.desc || '',
    taxonomyLicense: primaryTax.license || '',
    taxonomyState: primaryTax.state || '',
    taxonomyPrimary: primaryTax.primary || false,
    allTaxonomies: taxonomies.map(t => ({
      code: t.code,
      desc: t.desc,
      license: t.license,
      state: t.state,
      primary: t.primary,
    })),
    // Practice address
    address1: practiceAddr.address_1 || '',
    address2: practiceAddr.address_2 || '',
    city: practiceAddr.city || '',
    state: practiceAddr.state || '',
    zip: practiceAddr.postal_code || '',
    phone: practiceAddr.telephone_number || '',
    fax: practiceAddr.fax_number || '',
    // Mailing address
    mailingAddress1: mailingAddr.address_1 || '',
    mailingCity: mailingAddr.city || '',
    mailingState: mailingAddr.state || '',
    mailingZip: mailingAddr.postal_code || '',
    // Raw data
    _raw: result,
  };
}
