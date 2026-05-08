/**
 * EnnHealth Credentialing Ops v2 — CAQH ProView API Integration
 *
 * Routes all CAQH API calls through the Google Apps Script proxy
 * to keep API credentials server-side and avoid CORS.
 *
 * CAQH ProView API docs:
 *   - Roster API: check/add/remove providers on organization roster
 *   - Provider Status: get credentialing status for a provider
 *   - Provider Data: retrieve full provider profile data
 *   - Attestation: check attestation status and next due date
 */

import { store } from './store.js';
import { CONFIG } from './config.js';

// ─── Configuration ───

const CAQH_CONFIG_KEY = CONFIG.LOCALSTORAGE_PREFIX + 'caqh_config';

export function getCaqhConfig() {
  try {
    const raw = localStorage.getItem(CAQH_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { orgId: '', username: '', password: '', environment: 'production' };
  } catch {
    return { orgId: '', username: '', password: '', environment: 'production' };
  }
}

export function saveCaqhConfig(config) {
  localStorage.setItem(CAQH_CONFIG_KEY, JSON.stringify(config));
}

export function isCaqhConfigured() {
  const c = getCaqhConfig();
  return !!(c.orgId && c.username && c.password);
}

// ─── API Proxy Calls ───

async function caqhProxy(action, params = {}) {
  const config = getCaqhConfig();
  if (!config.orgId || !config.username) {
    throw new Error('CAQH credentials not configured. Go to Settings > CAQH to set up.');
  }

  const body = {
    action: 'caqh_proxy',
    caqhAction: action,
    caqhConfig: {
      orgId: config.orgId,
      username: config.username,
      password: config.password,
      environment: config.environment || 'production',
    },
    params,
  };

  const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  const text = await resp.text();
  const json = JSON.parse(text);
  if (!json.success) throw new Error(json.error || 'CAQH API call failed');
  return json.data;
}

// ─── Roster Operations ───

/**
 * Get roster status for a provider by CAQH ID or NPI
 */
export async function getRosterStatus(caqhProviderId) {
  return caqhProxy('roster_status', { caqhProviderId });
}

/**
 * Add a provider to the organization's CAQH roster
 */
export async function addToRoster(providerData) {
  return caqhProxy('roster_add', { provider: providerData });
}

/**
 * Remove a provider from the organization's roster
 */
export async function removeFromRoster(caqhProviderId) {
  return caqhProxy('roster_remove', { caqhProviderId });
}

// ─── Provider Status ───

/**
 * Get the credentialing/profile status of a provider
 * Returns: provider_status, provider_status_date, provider_practice_state, etc.
 */
export async function getProviderStatus(caqhProviderId) {
  return caqhProxy('provider_status', { caqhProviderId });
}

/**
 * Get provider status by NPI (convenience wrapper)
 */
export async function getProviderStatusByNPI(npi) {
  return caqhProxy('provider_status_npi', { npi });
}

// ─── Attestation ───

/**
 * Get attestation status for a provider
 * Returns: attestation_date, attestation_expiration_date, next_attestation_date
 */
export async function getAttestationStatus(caqhProviderId) {
  return caqhProxy('attestation_status', { caqhProviderId });
}

// ─── Provider Data (full profile) ───

/**
 * Get full provider profile data from CAQH
 */
export async function getProviderProfile(caqhProviderId) {
  return caqhProxy('provider_profile', { caqhProviderId });
}

// ─── Batch Status Check ───

/**
 * Check status for all providers in the store that have CAQH IDs
 */
export async function batchStatusCheck() {
  const providers = store.getAll('providers');
  const results = [];

  for (const prov of providers) {
    if (!prov.caqhId) continue;
    try {
      const status = await getProviderStatus(prov.caqhId);
      const attestation = await getAttestationStatus(prov.caqhId);
      results.push({
        providerId: prov.id,
        providerName: `${prov.firstName} ${prov.lastName}`,
        caqhId: prov.caqhId,
        status: status,
        attestation: attestation,
        error: null,
      });
    } catch (err) {
      results.push({
        providerId: prov.id,
        providerName: `${prov.firstName} ${prov.lastName}`,
        caqhId: prov.caqhId,
        status: null,
        attestation: null,
        error: err.message,
      });
    }
  }

  return results;
}

// ─── Local CAQH Tracking (localStorage) ───

const CAQH_TRACKING_KEY = CONFIG.LOCALSTORAGE_PREFIX + 'caqh_tracking';

export function getCaqhTracking() {
  try {
    const raw = localStorage.getItem(CAQH_TRACKING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCaqhTracking(data) {
  localStorage.setItem(CAQH_TRACKING_KEY, JSON.stringify(data));
}

/**
 * Update local tracking data from an API status check result
 */
export function updateTrackingFromResult(result) {
  const tracking = getCaqhTracking();
  const key = result.caqhId || result.providerId;
  tracking[key] = {
    ...tracking[key],
    providerId: result.providerId,
    providerName: result.providerName,
    caqhId: result.caqhId,
    lastChecked: new Date().toISOString(),
    profileStatus: result.status?.provider_status || tracking[key]?.profileStatus || 'Unknown',
    profileStatusDate: result.status?.provider_status_date || tracking[key]?.profileStatusDate || '',
    rosterStatus: result.status?.roster_status || tracking[key]?.rosterStatus || 'Unknown',
    attestationDate: result.attestation?.attestation_date || tracking[key]?.attestationDate || '',
    attestationExpires: result.attestation?.attestation_expiration_date || tracking[key]?.attestationExpires || '',
    nextAttestation: result.attestation?.next_attestation_date || tracking[key]?.nextAttestation || '',
    error: result.error,
  };
  saveCaqhTracking(tracking);
  return tracking[key];
}
