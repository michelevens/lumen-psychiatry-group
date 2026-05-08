/**
 * EnnHealth Credentialing Ops v2 — Batch Generator
 *
 * Generates application batches from strategy profiles.
 * Creates sets of applications for expansion into new states/payers.
 */

import { PAYER_CATALOG, getPayersByState, getPayersByCategory } from '../data/payers.js';
import { DEFAULT_STRATEGIES, REVENUE_DEFAULTS } from '../data/strategies.js';
import { store } from './store.js';

// ─── Generate Application Batch from Strategy ───

export function generateBatch(options = {}) {
  const {
    strategyId = null,
    strategy = null,
    targetStates = [],        // Override: only generate for these states
    excludeExisting = true,   // Skip payer+state combos that already have apps
    providerId = null,
    orgId = null,
  } = options;

  // Resolve strategy
  let strat = strategy;
  if (strategyId && !strat) {
    strat = DEFAULT_STRATEGIES.find(s => s.id === strategyId);
    if (!strat) {
      // Check custom strategies in store
      strat = store.getById('strategy_profiles', strategyId);
    }
  }
  if (!strat) {
    return { success: false, error: 'Strategy not found' };
  }

  // Determine target states
  let states = targetStates.length > 0 ? targetStates : (strat.targetStates || []);

  // If no states specified, use all licensed states
  if (states.length === 0) {
    const licenses = store.getAll('licenses')
      .filter(l => l.status === 'active');
    states = [...new Set(licenses.map(l => l.state))];
  }

  // Get existing applications to avoid duplicates
  const existingApps = excludeExisting ? store.getAll('applications') : [];
  const existingKeys = new Set(
    existingApps.map(a => `${a.payerId || a.payer}|${a.state}`)
  );

  // Generate applications
  const batch = [];

  for (const rule of strat.waveRules) {
    let payers = [];

    // Get payers matching this rule
    if (rule.payerIds) {
      payers = PAYER_CATALOG.filter(p => rule.payerIds.includes(p.id));
    } else if (rule.payerCategory) {
      payers = getPayersByCategory(rule.payerCategory);
    }

    // Apply market share filter
    if (rule.minMarketShare) {
      payers = payers.filter(p => (p.marketShare || 0) >= rule.minMarketShare);
    }

    for (const payer of payers) {
      // Determine which states this payer covers within our target states
      let payerStates;
      if (payer.states && payer.states.includes('ALL')) {
        payerStates = states; // National payer → all target states
      } else {
        payerStates = states.filter(s => payer.states && payer.states.includes(s));
      }

      // For national payers, create one application marked 'ALL'
      if (payer.states && payer.states.includes('ALL')) {
        payerStates = ['ALL'];
      }

      for (const state of payerStates) {
        const key = `${payer.id}|${state}`;
        const nameKey = `${payer.name}|${state}`;

        if (existingKeys.has(key) || existingKeys.has(nameKey)) continue;

        const estRevenue = estimateMonthlyRevenue(payer, rule.wave);

        // Apply revenue threshold
        if (strat.revenueThreshold && estRevenue < strat.revenueThreshold) continue;

        batch.push({
          payerId: payer.id,
          payerName: payer.name,
          state,
          wave: rule.wave,
          type: 'individual',
          status: 'not_started',
          estMonthlyRevenue: estRevenue,
          providerId: providerId || '',
          orgId: orgId || '',
          notes: payer.notes || '',
          tags: [strat.id, `wave_${rule.wave}`, payer.category],
        });

        existingKeys.add(key);
      }
    }
  }

  // Sort by wave then estimated revenue descending
  batch.sort((a, b) => a.wave - b.wave || b.estMonthlyRevenue - a.estMonthlyRevenue);

  return { success: true, batch, count: batch.length, strategy: strat.name };
}

// ─── Generate BCBS Target Set ───

export function generateBCBSBatch(targetStates = [], excludeExisting = true) {
  return generateBatch({
    strategyId: 'strat_bcbs_blitz',
    targetStates,
    excludeExisting,
  });
}

// ─── Generate Expansion for Specific States ───

export function generateStateExpansion(states, options = {}) {
  return generateBatch({
    strategyId: options.strategyId || 'strat_national_first',
    targetStates: states,
    excludeExisting: options.excludeExisting !== false,
    providerId: options.providerId,
    orgId: options.orgId,
  });
}

// ─── Commit Batch to Store ───

export function commitBatch(batch) {
  const result = store.bulkAdd('applications', 'application', batch);
  return result;
}

// ─── Revenue Estimation ───

export function estimateMonthlyRevenue(payer, wave) {
  const category = payer.category || 'regional';
  const rates = REVENUE_DEFAULTS.ratesByCategory[category] || REVENUE_DEFAULTS.ratesByCategory.regional;
  const volume = REVENUE_DEFAULTS.volumeByWave[wave] || REVENUE_DEFAULTS.volumeByWave[3];

  return Math.round(
    (volume.newPatientsPerMonth * rates.eval) +
    (volume.followupsPerMonth * rates.followup)
  );
}

// ─── Batch Preview (human-readable summary) ───

export function summarizeBatch(batch) {
  const byWave = {};
  const byState = {};
  let totalRevenue = 0;

  for (const app of batch) {
    const w = app.wave || 0;
    byWave[w] = (byWave[w] || 0) + 1;
    byState[app.state] = (byState[app.state] || 0) + 1;
    totalRevenue += app.estMonthlyRevenue || 0;
  }

  return {
    totalApplications: batch.length,
    byWave,
    byState,
    estimatedMonthlyRevenue: totalRevenue,
    estimatedAnnualRevenue: totalRevenue * 12,
    uniqueStates: Object.keys(byState).length,
    uniquePayers: new Set(batch.map(a => a.payerId || a.payerName)).size,
  };
}
