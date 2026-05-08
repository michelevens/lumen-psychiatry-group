/**
 * EnnHealth Credentialing Ops v2 — Strategy Profiles
 *
 * Predefined credentialing expansion strategies.
 * Each profile defines which payers to target, in what order,
 * with configurable wave assignments and revenue thresholds.
 */

export const DEFAULT_STRATEGIES = [
  {
    id: 'strat_national_first',
    name: 'National First',
    description: 'Prioritize national payers that cover all states with a single application, then layer in BCBS and regional plans.',
    waveRules: [
      { payerCategory: 'national', wave: 1, minMarketShare: 5 },
      { payerCategory: 'national', wave: 2, minMarketShare: 0 },
      { payerCategory: 'bcbs_anthem', wave: 2 },
      { payerCategory: 'bcbs_hcsc', wave: 2 },
      { payerCategory: 'bcbs_highmark', wave: 3 },
      { payerCategory: 'bcbs_independent', wave: 2 },
      { payerCategory: 'regional', wave: 3 },
    ],
    revenueThreshold: 0,
    autoWaveAssignment: true,
  },
  {
    id: 'strat_home_state_heavy',
    name: 'Home State Heavy',
    description: 'Maximize coverage in your home state (FL) first, then expand nationally. Best for practices with strong local referral networks.',
    targetStates: ['FL'],
    waveRules: [
      // FL-specific payers get Wave 1
      { payerIds: ['pyr_florida_blue', 'pyr_avmed', 'pyr_simply', 'pyr_sunshine'], wave: 1 },
      // National payers covering FL
      { payerCategory: 'national', wave: 1, minMarketShare: 9 },
      { payerCategory: 'national', wave: 2 },
      { payerCategory: 'bcbs_anthem', wave: 2 },
      { payerCategory: 'bcbs_independent', wave: 3 },
      { payerCategory: 'regional', wave: 3 },
    ],
    revenueThreshold: 1000,
    autoWaveAssignment: true,
  },
  {
    id: 'strat_bcbs_blitz',
    name: 'BCBS Blitz',
    description: 'Systematically credential with every BCBS plan across all licensed states. BCBS collectively covers ~35% of the commercially insured market.',
    waveRules: [
      { payerCategory: 'bcbs_anthem', wave: 1 },
      { payerCategory: 'bcbs_hcsc', wave: 1 },
      { payerCategory: 'bcbs_highmark', wave: 2 },
      { payerCategory: 'bcbs_independent', wave: 2 },
      { payerCategory: 'national', wave: 3 },
      { payerCategory: 'regional', wave: 3 },
    ],
    revenueThreshold: 0,
    autoWaveAssignment: true,
  },
  {
    id: 'strat_revenue_max',
    name: 'Revenue Maximizer',
    description: 'Prioritize payers with highest estimated revenue per application. Focus on high-reimbursement commercial plans before Medicaid/volume plays.',
    waveRules: [
      { payerCategory: 'national', wave: 1, minMarketShare: 9 },
      { payerCategory: 'bcbs_anthem', wave: 1 },
      { payerCategory: 'bcbs_independent', wave: 2, minAvgCredDays: 0 },
      { payerCategory: 'national', wave: 2 },
      { payerCategory: 'regional', wave: 3 },
    ],
    revenueThreshold: 2000,
    autoWaveAssignment: true,
  },
  {
    id: 'strat_telehealth_expansion',
    name: 'Telehealth Expansion',
    description: 'Target states with highest telehealth demand and poorest mental health access. Prioritize underserved markets.',
    targetStates: ['NV', 'AZ', 'TX', 'FL', 'CO', 'WA', 'VA', 'NY', 'MA', 'CT'],
    waveRules: [
      { payerCategory: 'national', wave: 1, minMarketShare: 9 },
      { payerCategory: 'bcbs_anthem', wave: 1 },
      { payerCategory: 'national', wave: 2 },
      { payerCategory: 'bcbs_independent', wave: 2 },
      { payerCategory: 'regional', wave: 2 },
    ],
    revenueThreshold: 1500,
    autoWaveAssignment: true,
  },
  {
    id: 'strat_medicaid_volume',
    name: 'Medicaid Volume Play',
    description: 'Focus on Medicaid managed care plans. Lower reimbursement but high patient volume and shorter credentialing times.',
    waveRules: [
      { payerIds: ['pyr_medicare'], wave: 1 },
      { payerIds: ['pyr_centene', 'pyr_molina'], wave: 1 },
      { payerIds: ['pyr_wellcare', 'pyr_fidelis', 'pyr_sunshine', 'pyr_coordinated_care', 'pyr_mercy_care', 'pyr_superior', 'pyr_caresource', 'pyr_priority_partners'], wave: 2 },
      { payerCategory: 'national', wave: 3 },
    ],
    revenueThreshold: 0,
    autoWaveAssignment: true,
  },
];

// ─── Revenue Assumptions ───

export const REVENUE_DEFAULTS = {
  // Per-visit rates by payer category (estimated, used for projections)
  ratesByCategory: {
    national: { eval: 175, followup: 110 },
    bcbs_anthem: { eval: 185, followup: 120 },
    bcbs_hcsc: { eval: 180, followup: 115 },
    bcbs_highmark: { eval: 175, followup: 110 },
    bcbs_independent: { eval: 180, followup: 115 },
    regional: { eval: 160, followup: 100 },
    medicaid: { eval: 120, followup: 75 },
  },

  // Monthly patient volume assumptions by payer tier
  volumeByWave: {
    1: { newPatientsPerMonth: 8, followupsPerMonth: 20 },
    2: { newPatientsPerMonth: 5, followupsPerMonth: 12 },
    3: { newPatientsPerMonth: 3, followupsPerMonth: 8 },
  },

  // Ramp-up curve: months after effective date → % of full volume
  rampUpCurve: [
    { month: 1, pct: 0.1 },
    { month: 2, pct: 0.25 },
    { month: 3, pct: 0.5 },
    { month: 6, pct: 0.75 },
    { month: 12, pct: 1.0 },
  ],
};

// ─── Follow-up Rules ───

export const FOLLOWUP_RULES = {
  // Default follow-up schedule by status
  scheduleByStatus: {
    submitted: { intervalDays: 14, maxFollowups: 8 },
    in_review: { intervalDays: 21, maxFollowups: 6 },
    pending_info: { intervalDays: 7, maxFollowups: 10 },
  },

  // Escalation thresholds
  escalation: {
    daysWithoutResponse: 45,
    maxFollowupsBeforeEscalation: 3,
  },

  // Auto-generate next follow-up date when status changes
  autoSchedule: true,
};
