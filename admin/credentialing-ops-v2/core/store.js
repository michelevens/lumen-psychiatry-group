/**
 * EnnHealth Credentialing Ops v2 — Data Store
 *
 * Cache-first data store backed by Google Sheets via Apps Script.
 * All reads are instant (from in-memory cache).
 * All writes update the cache immediately, then sync to Sheets async.
 * Falls back to localStorage if Sheets is unavailable.
 */

import { generateId, validateEntity } from '../data/schema.js';
import { CONFIG } from './config.js';

class CredentialingStore {
  constructor() {
    this.listeners = new Map();
    this.collections = [
      'organizations', 'providers', 'licenses',
      'payers', 'applications', 'followups', 'strategy_profiles', 'activity_logs',
      'telehealth_policies', 'tasks', 'users', 'emailLog', 'invoices',
      'provider_education', 'board_certifications', 'work_history',
      'malpractice_policies', 'provider_cme', 'provider_references',
      'provider_documents', 'exclusion_checks', 'org_contacts',
    ];
    this.cache = {};
    this.collections.forEach(c => { this.cache[c] = []; });

    this.dirtyCollections = new Set();
    this.syncTimer = null;
    this.syncStatus = 'idle'; // 'idle' | 'syncing' | 'error'
    this.lastSyncError = null;
    this.initialized = false;
    this.useSheets = !!CONFIG.APPS_SCRIPT_URL;
  }

  // ─── Initialization ───

  async init() {
    if (this.initialized) return;

    if (this.useSheets) {
      try {
        const data = await this._fetchAllCollections();
        for (const c of this.collections) {
          if (data[c] && Array.isArray(data[c]) && data[c].length > 0) {
            this.cache[c] = data[c];
            this._saveToLocalStorage(c, this.cache[c]);
          } else {
            // Sheets doesn't have this collection yet — preserve localStorage data
            this.cache[c] = this._loadFromLocalStorage(c);
          }
        }
        this.initialized = true;
        return;
      } catch (err) {
        console.warn('Google Sheets fetch failed, falling back to localStorage:', err);
        this.lastSyncError = err.message;
        this.syncStatus = 'error';
      }
    }

    // Fallback: load from localStorage
    for (const c of this.collections) {
      this.cache[c] = this._loadFromLocalStorage(c);
    }
    this.initialized = true;
  }

  // ─── Collection Access ───

  getAll(collection) {
    return [...(this.cache[collection] || [])];
  }

  _saveAll(collection, data) {
    this.cache[collection] = data;
    this._saveToLocalStorage(collection, data);
    this._notify(collection, data);
    this._queueSync(collection);
  }

  getById(collection, id) {
    return this.getAll(collection).find(item => item.id === id) || null;
  }

  // ─── CRUD ───

  add(collection, entityType, data) {
    const prefix = this._prefixForType(entityType);
    const now = new Date().toISOString();
    const record = {
      ...data,
      id: data.id || generateId(prefix),
      createdAt: now,
      updatedAt: now,
    };

    const validation = validateEntity(entityType, record);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const all = this.getAll(collection);
    all.push(record);
    this._saveAll(collection, all);
    return { success: true, record };
  }

  update(collection, id, updates) {
    const all = this.getAll(collection);
    const idx = all.findIndex(item => item.id === id);
    if (idx === -1) return { success: false, errors: ['Record not found'] };

    all[idx] = { ...all[idx], ...updates, id, updatedAt: new Date().toISOString() };
    this._saveAll(collection, all);
    return { success: true, record: all[idx] };
  }

  remove(collection, id) {
    const all = this.getAll(collection).filter(item => item.id !== id);
    this._saveAll(collection, all);
    return { success: true };
  }

  clear(collection) {
    this._autoBackup();
    this._saveAll(collection, []);
  }

  clearAll() {
    this._autoBackup();
    this.collections.forEach(c => {
      this.cache[c] = [];
      this._saveToLocalStorage(c, []);
      this._notify(c, []);
      this._queueSync(c);
    });
  }

  _autoBackup() {
    try {
      const backup = {};
      this.collections.forEach(c => { backup[c] = this.cache[c] || []; });
      backup._backupAt = new Date().toISOString();
      backup._version = 2;
      localStorage.setItem(CONFIG.LOCALSTORAGE_PREFIX + 'auto_backup', JSON.stringify(backup));
    } catch { /* quota exceeded — skip backup */ }
  }

  restoreFromBackup() {
    try {
      const raw = localStorage.getItem(CONFIG.LOCALSTORAGE_PREFIX + 'auto_backup');
      if (!raw) return { success: false, errors: ['No backup found'] };
      const data = JSON.parse(raw);
      return this.importAll(data);
    } catch (e) {
      return { success: false, errors: [e.message] };
    }
  }

  // ─── Bulk Operations ───

  bulkAdd(collection, entityType, records) {
    const all = this.getAll(collection);
    const now = new Date().toISOString();
    const prefix = this._prefixForType(entityType);
    const added = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = {
        ...records[i],
        id: records[i].id || generateId(prefix),
        createdAt: records[i].createdAt || now,
        updatedAt: now,
      };
      const validation = validateEntity(entityType, record);
      if (!validation.valid) {
        errors.push({ index: i, errors: validation.errors });
        continue;
      }
      all.push(record);
      added.push(record);
    }

    if (added.length > 0) this._saveAll(collection, all);
    return { success: errors.length === 0, count: added.length, records: added, errors };
  }

  bulkReplace(collection, records) {
    this._saveAll(collection, records);
    return { success: true, count: records.length };
  }

  // ─── Querying ───

  query(collection, filters = {}) {
    let results = this.getAll(collection);

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;

      if (Array.isArray(value)) {
        results = results.filter(r => value.includes(r[key]));
      } else {
        results = results.filter(r => r[key] === value);
      }
    }

    return results;
  }

  count(collection, filters = {}) {
    return this.query(collection, filters).length;
  }

  // ─── Event System ───

  on(collection, callback) {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection).add(callback);
    return () => this.listeners.get(collection).delete(callback);
  }

  _notify(collection, data) {
    const listeners = this.listeners.get(collection);
    if (listeners) {
      listeners.forEach(cb => {
        try { cb(data); } catch (e) { console.error('Store listener error:', e); }
      });
    }
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(cb => {
        try { cb(collection, data); } catch (e) { console.error('Store listener error:', e); }
      });
    }
  }

  // ─── Export / Import ───

  exportAll() {
    const data = {};
    this.collections.forEach(c => {
      data[c] = this.getAll(c);
    });
    data._exportedAt = new Date().toISOString();
    data._version = 2;
    return data;
  }

  importAll(data) {
    if (data._version !== 2) {
      return { success: false, errors: ['Incompatible data version'] };
    }
    this.collections.forEach(c => {
      if (data[c] && Array.isArray(data[c])) {
        this._saveAll(c, data[c]);
      }
    });
    return { success: true };
  }

  // ─── Stats ───

  getStats() {
    const apps = this.getAll('applications');
    const followups = this.getAll('followups');
    const today = new Date().toISOString().split('T')[0];

    return {
      total: apps.length,
      byStatus: this._countBy(apps, 'status'),
      byWave: this._countBy(apps, 'wave'),
      byState: this._countBy(apps, 'state'),
      approved: apps.filter(a => a.status === 'approved').length,
      inProgress: apps.filter(a => ['submitted', 'in_review', 'pending_info'].includes(a.status)).length,
      denied: apps.filter(a => a.status === 'denied').length,
      notStarted: apps.filter(a => a.status === 'not_started').length,
      followupsDue: followups.filter(f => !f.completedDate && f.dueDate <= today).length,
      followupsUpcoming: followups.filter(f => !f.completedDate && f.dueDate > today).length,
      estMonthlyRevenue: apps
        .filter(a => a.status === 'approved')
        .reduce((sum, a) => sum + (Number(a.estMonthlyRevenue) || 0), 0),
      projectedRevenue: apps
        .filter(a => ['submitted', 'in_review', 'pending_info'].includes(a.status))
        .reduce((sum, a) => sum + (Number(a.estMonthlyRevenue) || 0), 0),
    };
  }

  _countBy(arr, key) {
    const counts = {};
    arr.forEach(item => {
      const val = item[key] || 'unknown';
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  }

  // ─── Google Sheets Sync ───

  _queueSync(collection) {
    if (!this.useSheets) return;

    this.dirtyCollections.add(collection);
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this._flushSync(), CONFIG.SYNC_DEBOUNCE_MS);
  }

  async flush() {
    if (!this.useSheets || this.dirtyCollections.size === 0) return;
    clearTimeout(this.syncTimer);
    await this._flushSync();
  }

  async _flushSync() {
    if (this.dirtyCollections.size === 0) return;

    const toSync = [...this.dirtyCollections];
    this.dirtyCollections.clear();
    this.syncStatus = 'syncing';
    this._notifySyncStatus();

    const collectionsData = {};
    for (const c of toSync) {
      collectionsData[c] = this.cache[c] || [];
    }

    let retries = 0;
    while (retries < CONFIG.MAX_RETRIES) {
      try {
        await this._post({ action: 'bulkSync', collections: collectionsData });
        this.syncStatus = 'idle';
        this.lastSyncError = null;
        this._notifySyncStatus();
        return;
      } catch (err) {
        retries++;
        console.warn(`Sync attempt ${retries} failed:`, err);
        if (retries < CONFIG.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * retries));
        }
      }
    }

    this.syncStatus = 'error';
    this.lastSyncError = 'Sync failed after ' + CONFIG.MAX_RETRIES + ' retries';
    this._notifySyncStatus();
    // Re-add to dirty so next mutation retries
    toSync.forEach(c => this.dirtyCollections.add(c));
  }

  async _fetchAllCollections() {
    const url = CONFIG.APPS_SCRIPT_URL + '?action=getAllCollections';
    const text = await this._fetchText(url);
    const json = JSON.parse(text);
    if (!json.success) throw new Error(json.error || 'Fetch failed');
    return json.data;
  }

  async _post(body) {
    const text = await this._fetchText(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });
    const json = JSON.parse(text);
    if (!json.success) throw new Error(json.error || 'POST failed');
    return json;
  }

  async _fetchText(url, options = {}) {
    // Google Apps Script redirects (302). fetch with redirect:'follow' works,
    // but some environments need explicit handling.
    const resp = await fetch(url, { redirect: 'follow', ...options });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    return await resp.text();
  }

  // ─── Sync Status Events ───

  _notifySyncStatus() {
    const listeners = this.listeners.get('_sync');
    if (listeners) {
      listeners.forEach(cb => {
        try { cb(this.syncStatus, this.lastSyncError); } catch (e) { /* ignore */ }
      });
    }
  }

  onSyncStatus(callback) {
    return this.on('_sync', callback);
  }

  // ─── localStorage Fallback ───

  _loadFromLocalStorage(collection) {
    try {
      const raw = localStorage.getItem(CONFIG.LOCALSTORAGE_PREFIX + collection);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _saveToLocalStorage(collection, data) {
    try {
      localStorage.setItem(CONFIG.LOCALSTORAGE_PREFIX + collection, JSON.stringify(data));
    } catch { /* quota exceeded or unavailable — ignore */ }
  }

  // ─── Helpers ───

  _prefixForType(entityType) {
    const map = {
      organization: 'org',
      provider: 'prov',
      license: 'lic',
      payer: 'pyr',
      payer_plan: 'plan',
      application: 'app',
      followup: 'fu',
      strategy_profile: 'strat',
      activity_log: 'log',
      telehealth_policy: 'thp',
      task: 'tsk',
      provider_education: 'edu',
      board_certification: 'brd',
      work_history: 'wrk',
      malpractice_policy: 'mal',
      provider_cme: 'cme',
      provider_reference: 'ref',
      provider_document: 'pdoc',
      exclusion_check: 'exc',
      org_contact: 'ocon',
    };
    return map[entityType] || 'rec';
  }
}

// Singleton
export const store = new CredentialingStore();
