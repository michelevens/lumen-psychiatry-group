/**
 * EnnHealth Credentialing Ops v2 — Migration Utility
 *
 * Imports data from the v1 credentialing tracker into v2 format.
 * Handles field mapping, payer name → ID resolution, and data normalization.
 */

import { PAYER_CATALOG, getPayerByName } from '../data/payers.js';
import { DEFAULT_PROVIDER, DEFAULT_ORGANIZATION } from '../data/providers.js';
import { store } from './store.js';
import { generateId } from '../data/schema.js';

// ─── V1 Data Shape ───
// {
//   id: 'cred_...',
//   state: 'FL',
//   payer: 'Florida Blue',
//   wave: '1',
//   status: 'not_started' | 'submitted' | 'in_review' | 'pending_info' | 'approved' | 'denied',
//   credType: 'individual' | 'group' | 'both',
//   providerId: 'PRV-12345678',
//   applied: 'YYYY-MM-DD',
//   followup: 'YYYY-MM-DD',
//   effective: 'YYYY-MM-DD',
//   revenue: '3000',
//   notes: 'Free text...'
// }

// ─── Payer Name → ID Resolution ───

const PAYER_NAME_MAP = buildPayerNameMap();

function buildPayerNameMap() {
  const map = {};
  for (const p of PAYER_CATALOG) {
    map[p.name.toLowerCase()] = p.id;
    if (p.shortName) map[p.shortName.toLowerCase()] = p.id;
    // Common aliases
  }
  // Manual aliases for v1 names that don't exactly match v2 catalog
  map['unitedHealthcare / optum'] = 'pyr_uhc';
  map['unitedHealthcare'] = 'pyr_uhc';
  map['aetna (cvs health)'] = 'pyr_aetna';
  map['aetna'] = 'pyr_aetna';
  map['cigna / evernorth'] = 'pyr_cigna';
  map['cigna'] = 'pyr_cigna';
  map['medicare (cms)'] = 'pyr_medicare';
  map['medicare'] = 'pyr_medicare';
  map['medicaid'] = 'pyr_medicare'; // Maps to Medicare for now; should be state-specific
  map['tricare (military)'] = 'pyr_tricare';
  map['tricare'] = 'pyr_tricare';
  map['centene / ambetter'] = 'pyr_centene';
  map['centene/ambetter'] = 'pyr_centene';
  map['molina healthcare'] = 'pyr_molina';
  map['molina'] = 'pyr_molina';
  map['oscar health'] = 'pyr_oscar';
  map['oscar'] = 'pyr_oscar';
  map['anthem / elevance (multi-state)'] = 'pyr_anthem';
  map['anthem/elevance'] = 'pyr_anthem';
  map['florida blue (bcbs fl)'] = 'pyr_florida_blue';
  map['florida blue'] = 'pyr_florida_blue';
  map['carefirst bcbs (md/dc/n.va)'] = 'pyr_carefirst';
  map['carefirst bcbs'] = 'pyr_carefirst';
  map['bcbs of massachusetts'] = 'pyr_bcbs_ma';
  map['bcbs of ma'] = 'pyr_bcbs_ma';
  map['premera blue cross (wa/ak)'] = 'pyr_premera';
  map['premera blue cross'] = 'pyr_premera';
  map['regence blueshield washington'] = 'pyr_regence';
  map['regence blueshield'] = 'pyr_regence';
  map['bcbs of arizona'] = 'pyr_bcbs_az';
  map['bcbs of az'] = 'pyr_bcbs_az';
  map['emblemhealth (ny)'] = 'pyr_emblem';
  map['emblemhealth'] = 'pyr_emblem';
  map['fidelis care (ny medicaid)'] = 'pyr_fidelis';
  map['fidelis'] = 'pyr_fidelis';
  map['fidelis care'] = 'pyr_fidelis';
  map['connecticare (ct)'] = 'pyr_connecticare';
  map['connecticare'] = 'pyr_connecticare';
  map['health plan of nevada (uhc sub)'] = 'pyr_hpn';
  map['health plan of nevada'] = 'pyr_hpn';
  map['kaiser permanente'] = 'pyr_kaiser';
  map['optima health'] = 'pyr_optima';
  map['harvard pilgrim (ma/nh/me/ct)'] = 'pyr_harvard_pilgrim';
  map['harvard pilgrim'] = 'pyr_harvard_pilgrim';
  map['avmed (fl)'] = 'pyr_avmed';
  map['avmed'] = 'pyr_avmed';
  map['priority partners (md medicaid)'] = 'pyr_priority_partners';
  map['priority partners'] = 'pyr_priority_partners';
  map['mercy care (az medicaid)'] = 'pyr_mercy_care';
  map['mercy care'] = 'pyr_mercy_care';
  map['coordinated care (wa medicaid)'] = 'pyr_coordinated_care';
  map['coordinated care'] = 'pyr_coordinated_care';
  map['horizon bcbs (nj)'] = 'pyr_horizon';
  map['horizon bcbs'] = 'pyr_horizon';
  map['humana'] = 'pyr_humana';
  return map;
}

function resolvePayerId(payerName) {
  if (!payerName) return null;
  const lower = payerName.toLowerCase().trim();
  return PAYER_NAME_MAP[lower] || null;
}

// ─── Import from V1 ───

export function importFromV1(v1Data, options = {}) {
  const {
    providerId = DEFAULT_PROVIDER.id,
    orgId = DEFAULT_ORGANIZATION.id,
    dryRun = false,
    mergeMode = 'skip', // 'skip' | 'overwrite' | 'merge'
  } = options;

  const results = {
    total: v1Data.length,
    imported: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    applications: [],
    followups: [],
    unmappedPayers: [],
  };

  const existingApps = store.getAll('applications');
  const existingKeys = new Set(existingApps.map(a => `${a.payerId}|${a.state}`));

  for (const v1 of v1Data) {
    try {
      const payerId = resolvePayerId(v1.payer);
      if (!payerId) {
        results.warnings.push(`Unmapped payer: "${v1.payer}" (state: ${v1.state}). Importing with name reference.`);
        if (!results.unmappedPayers.includes(v1.payer)) {
          results.unmappedPayers.push(v1.payer);
        }
      }

      const key = `${payerId || v1.payer}|${v1.state}`;
      if (mergeMode === 'skip' && existingKeys.has(key)) {
        results.skipped++;
        continue;
      }

      // Map v1 → v2 application
      const app = {
        id: v1.id || generateId('app'),
        providerId,
        orgId,
        payerId: payerId || '',
        payerName: v1.payer || '',     // Keep original name for reference
        state: v1.state || '',
        type: v1.credType || 'individual',
        wave: parseInt(v1.wave) || 1,
        status: normalizeStatus(v1.status),
        enrollmentId: v1.providerId || '',
        submittedDate: v1.applied || '',
        effectiveDate: v1.effective || '',
        estMonthlyRevenue: parseInt(v1.revenue) || 0,
        notes: v1.notes || '',
        tags: ['imported_v1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      results.applications.push(app);

      // Create follow-up record if v1 had a follow-up date
      if (v1.followup) {
        results.followups.push({
          id: generateId('fu'),
          applicationId: app.id,
          type: 'status_check',
          dueDate: v1.followup,
          method: 'phone',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      existingKeys.add(key);
      results.imported++;
    } catch (e) {
      results.errors.push(`Error importing ${v1.payer} / ${v1.state}: ${e.message}`);
    }
  }

  // Commit if not dry run
  if (!dryRun && results.applications.length > 0) {
    store.bulkAdd('applications', 'application', results.applications);
    if (results.followups.length > 0) {
      store.bulkAdd('followups', 'followup', results.followups);
    }
  }

  return results;
}

// ─── Import from V1 localStorage directly ───

export function importFromV1LocalStorage() {
  const raw = localStorage.getItem('ennhealth_credentialing');
  if (!raw) {
    return { success: false, error: 'No v1 data found in localStorage (key: ennhealth_credentialing)' };
  }

  try {
    const v1Data = JSON.parse(raw);
    if (!Array.isArray(v1Data)) {
      return { success: false, error: 'V1 data is not an array' };
    }
    return { success: true, ...importFromV1(v1Data) };
  } catch (e) {
    return { success: false, error: 'Failed to parse v1 data: ' + e.message };
  }
}

// ─── Import from V1 Google Sheets ───

const V1_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKf9dYXvKjdLNfCskvsbVbJEQV-GPIQEhmJ3Cpf7_B-lFuNCBCWCOkqvE8GOaLJOml6g/exec';

export async function importFromV1Cloud() {
  try {
    const resp = await fetch(V1_APPS_SCRIPT_URL + '?action=getAll', { redirect: 'follow' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const json = JSON.parse(text);

    if (!json.success) {
      return { success: false, error: json.error || 'V1 API returned error' };
    }

    const v1Data = json.data;
    if (!Array.isArray(v1Data) || v1Data.length === 0) {
      return { success: false, error: 'No applications found in V1 Google Sheets' };
    }

    // Map V1 field names (from Google Sheets columns) to expected format
    const mapped = v1Data.map(row => ({
      id: row.id || '',
      state: row.state || '',
      payer: row.payer || '',
      wave: row.wave || '1',
      status: row.status || 'not_started',
      credType: row.credType || row.credential_type || row.cred_type || 'individual',
      providerId: row.providerId || row.provider_id || '',
      applied: row.applied || '',
      followup: row.followup || row.follow_up || '',
      effective: row.effective || row.effective_date || '',
      revenue: row.revenue || row.est_monthly_revenue || '0',
      notes: row.notes || '',
    }));

    return { success: true, ...importFromV1(mapped) };
  } catch (e) {
    return { success: false, error: 'Failed to fetch V1 data: ' + e.message };
  }
}

export async function previewV1CloudImport() {
  try {
    const resp = await fetch(V1_APPS_SCRIPT_URL + '?action=getAll', { redirect: 'follow' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const json = JSON.parse(text);

    if (!json.success) {
      return { success: false, error: json.error || 'V1 API returned error' };
    }

    const v1Data = json.data;
    if (!Array.isArray(v1Data) || v1Data.length === 0) {
      return { success: false, error: 'No applications found in V1 Google Sheets' };
    }

    const mapped = v1Data.map(row => ({
      id: row.id || '',
      state: row.state || '',
      payer: row.payer || '',
      wave: row.wave || '1',
      status: row.status || 'not_started',
      credType: row.credType || row.credential_type || row.cred_type || 'individual',
      providerId: row.providerId || row.provider_id || '',
      applied: row.applied || '',
      followup: row.followup || row.follow_up || '',
      effective: row.effective || row.effective_date || '',
      revenue: row.revenue || row.est_monthly_revenue || '0',
      notes: row.notes || '',
    }));

    return { success: true, ...importFromV1(mapped, { dryRun: true }) };
  } catch (e) {
    return { success: false, error: 'Failed to fetch V1 data: ' + e.message };
  }
}

// ─── Import from CSV ───

export function importFromCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { success: false, error: 'CSV must have at least a header row and one data row' };
  }

  const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    const record = {};
    headers.forEach((h, idx) => {
      record[mapCSVHeader(h)] = values[idx] || '';
    });
    records.push(record);
  }

  return { success: true, ...importFromV1(records) };
}

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapCSVHeader(header) {
  const map = {
    'wave': 'wave',
    'state': 'state',
    'payer': 'payer',
    'status': 'status',
    'credential type': 'credType',
    'provider id': 'providerId',
    'applied': 'applied',
    'follow-up': 'followup',
    'follow up': 'followup',
    'effective date': 'effective',
    'est. monthly revenue': 'revenue',
    'est monthly revenue': 'revenue',
    'notes': 'notes',
  };
  return map[header] || header;
}

function normalizeStatus(status) {
  if (!status) return 'not_started';
  const s = status.toLowerCase().replace(/\s+/g, '_');
  const valid = ['not_started', 'submitted', 'in_review', 'pending_info', 'approved', 'denied', 'withdrawn'];
  return valid.includes(s) ? s : 'not_started';
}

// ─── Export V2 Data for Backup ───

export function exportV2Data() {
  return store.exportAll();
}

// ─── Dry Run Preview ───

export function previewImport(v1Data) {
  return importFromV1(v1Data, { dryRun: true });
}
