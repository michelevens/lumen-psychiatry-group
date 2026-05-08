/**
 * EnnHealth Credentialing Ops v2 — Data Schema
 *
 * Defines the canonical data model for all entities.
 * Every record stored in the system conforms to these shapes.
 */

export const ENTITY_TYPES = {
  ORGANIZATION: 'organization',
  PROVIDER: 'provider',
  LICENSE: 'license',
  PAYER: 'payer',
  PAYER_PLAN: 'payer_plan',
  APPLICATION: 'application',
  FOLLOWUP: 'followup',
  STRATEGY_PROFILE: 'strategy_profile',
  TASK: 'task',
  PROVIDER_EDUCATION: 'provider_education',
  BOARD_CERTIFICATION: 'board_certification',
  WORK_HISTORY: 'work_history',
  MALPRACTICE_POLICY: 'malpractice_policy',
  PROVIDER_CME: 'provider_cme',
  PROVIDER_REFERENCE: 'provider_reference',
  PROVIDER_DOCUMENT: 'provider_document',
  EXCLUSION_CHECK: 'exclusion_check',
  ORG_CONTACT: 'org_contact',
};

// ─── Schema Definitions ───

export const schemas = {

  organization: {
    id: 'string',           // org_<timestamp>
    name: 'string',
    npi: 'string',          // Group NPI
    taxId: 'string',
    address: 'object',      // { street, city, state, zip }
    phone: 'string',
    email: 'string',
    taxonomy: 'string',     // Taxonomy code
    createdAt: 'string',    // ISO date
    updatedAt: 'string',
  },

  provider: {
    id: 'string',           // prov_<timestamp>
    orgId: 'string',        // FK → organization
    firstName: 'string',
    lastName: 'string',
    credentials: 'string',  // e.g. "DNP, PMHNP-BC, FNP-BC"
    npi: 'string',          // Individual NPI
    taxonomy: 'string',
    specialty: 'string',
    email: 'string',
    phone: 'string',
    active: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  },

  license: {
    id: 'string',           // lic_<timestamp>
    providerId: 'string',   // FK → provider
    state: 'string',        // 2-letter state code
    licenseNumber: 'string',
    licenseType: 'string',  // APRN, NP, RN, etc.
    status: 'string',       // active | pending | expired | inactive
    issueDate: 'string',    // YYYY-MM-DD
    expirationDate: 'string',
    renewalDate: 'string',
    compactState: 'boolean', // Part of NLC/APRN compact?
    notes: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },

  payer: {
    id: 'string',           // pyr_<slug>
    name: 'string',
    category: 'string',     // national | bcbs_anthem | bcbs_hcsc | bcbs_highmark | bcbs_independent | regional | medicaid | medicare
    region: 'string',       // northeast | southeast | midwest | west | pacific_nw | south | national
    parentOrg: 'string',    // e.g. "Elevance" for Anthem plans
    stediId: 'string',      // Stedi trading partner ID
    states: 'array',        // States where this payer operates
    credentialingUrl: 'string',
    avgCredDays: 'number',  // Average credentialing turnaround in days
    notes: 'string',
  },

  payer_plan: {
    id: 'string',           // plan_<timestamp>
    payerId: 'string',      // FK → payer
    name: 'string',         // e.g. "Aetna Commercial", "Aetna Medicare Advantage"
    type: 'string',         // commercial | medicare_advantage | medicaid | marketplace | tricare
    state: 'string',        // State-specific plan
    reimbursementRate: 'number', // Estimated avg per visit
    notes: 'string',
  },

  application: {
    id: 'string',           // app_<timestamp>
    providerId: 'string',   // FK → provider
    orgId: 'string',        // FK → organization
    payerId: 'string',      // FK → payer
    planId: 'string',       // FK → payer_plan (optional)
    state: 'string',        // State this application covers
    type: 'string',         // individual | group | both
    wave: 'number',         // 1, 2, 3 (priority wave)
    status: 'string',       // not_started | submitted | in_review | pending_info | approved | denied | withdrawn
    portalUrl: 'string',    // Link to payer portal
    applicationRef: 'string', // Payer-assigned application/reference number
    enrollmentId: 'string', // Provider ID once approved
    submittedDate: 'string',
    receivedDate: 'string', // Date payer acknowledged receipt
    effectiveDate: 'string',
    denialReason: 'string',
    estMonthlyRevenue: 'number',
    payerContactName: 'string',  // Direct contact at payer
    payerContactPhone: 'string',
    payerContactEmail: 'string',
    notes: 'string',
    tags: 'array',          // Custom tags for filtering
    createdAt: 'string',
    updatedAt: 'string',
  },

  followup: {
    id: 'string',           // fu_<timestamp>
    applicationId: 'string', // FK → application
    type: 'string',         // status_check | document_request | info_response | escalation | general
    dueDate: 'string',      // YYYY-MM-DD
    completedDate: 'string',
    method: 'string',       // phone | email | portal | fax
    contactName: 'string',
    contactPhone: 'string',
    contactEmail: 'string',
    outcome: 'string',      // Free text summary of what happened
    nextAction: 'string',   // What to do next
    createdAt: 'string',
    updatedAt: 'string',
  },

  strategy_profile: {
    id: 'string',           // strat_<slug>
    name: 'string',
    description: 'string',
    targetStates: 'array',  // States to target
    waveRules: 'array',     // Array of { payerCategory, wave, priority }
    revenueThreshold: 'number', // Min estimated monthly revenue to include
    autoWaveAssignment: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  },

  activity_log: {
    id: 'string',           // log_<timestamp>
    applicationId: 'string', // FK → application
    type: 'string',         // call | email | portal_check | status_change | note | document
    date: 'string',         // YYYY-MM-DD
    contactName: 'string',  // Who you spoke to
    contactPhone: 'string',
    refNumber: 'string',    // Reference / confirmation number
    outcome: 'string',      // What happened
    nextStep: 'string',     // What to do next
    statusFrom: 'string',   // Previous status (for status_change type)
    statusTo: 'string',     // New status (for status_change type)
    createdBy: 'string',    // Who logged this (for multi-user)
    createdAt: 'string',
  },

  task: {
    id: 'string',           // tsk_<timestamp>
    title: 'string',
    category: 'string',     // credentialing | licensing | followup | document | audit | other
    priority: 'string',     // urgent | high | normal | low
    dueDate: 'string',      // YYYY-MM-DD
    linkedAppId: 'string',  // FK → application (optional)
    recurrence: 'string',   // '' | daily | weekly | biweekly | monthly | quarterly
    notes: 'string',
    completed: 'boolean',
    completedAt: 'string',  // ISO date
    createdAt: 'string',
    updatedAt: 'string',
  },

  provider_education: {
    id: 'string',
    providerId: 'string',
    institution: 'string',
    degree: 'string',
    fieldOfStudy: 'string',
    educationType: 'string', // medical_school | residency | fellowship | other
    startDate: 'string',
    graduationDate: 'string',
    isCompleted: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  },

  board_certification: {
    id: 'string',
    providerId: 'string',
    boardName: 'string',
    specialty: 'string',
    certificateNumber: 'string',
    initialDate: 'string',
    expirationDate: 'string',
    isLifetime: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  },

  work_history: {
    id: 'string',
    providerId: 'string',
    employer: 'string',
    position: 'string',
    startDate: 'string',
    endDate: 'string',
    isCurrent: 'boolean',
    supervisorName: 'string',
    supervisorPhone: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },

  malpractice_policy: {
    id: 'string',
    providerId: 'string',
    carrierName: 'string',
    policyNumber: 'string',
    coverageType: 'string', // occurrence | claims_made
    perIncident: 'string',
    aggregate: 'string',
    effectiveDate: 'string',
    expirationDate: 'string',
    hasTailCoverage: 'boolean',
    hasClaimsHistory: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  },

  provider_cme: {
    id: 'string',
    providerId: 'string',
    courseName: 'string',
    providerOrg: 'string',
    creditHours: 'number',
    creditType: 'string', // cme | ce | contact_hours
    completionDate: 'string',
    expirationDate: 'string',
    certificateNumber: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },

  provider_reference: {
    id: 'string',
    providerId: 'string',
    name: 'string',
    title: 'string',
    organization: 'string',
    relationship: 'string',
    phone: 'string',
    email: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },

  provider_document: {
    id: 'string',
    providerId: 'string',
    documentType: 'string',
    documentName: 'string',
    status: 'string', // pending | received | verified | expired
    receivedDate: 'string',
    expirationDate: 'string',
    notes: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },

  exclusion_check: {
    id: 'string',
    providerId: 'string',
    checkDate: 'string',
    result: 'string', // clear | excluded | error
    source: 'string',
    notes: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },

  org_contact: {
    id: 'string',
    orgId: 'string',
    name: 'string',
    title: 'string',
    email: 'string',
    phone: 'string',
    role: 'string', // owner | admin | billing | credentialing
    createdAt: 'string',
    updatedAt: 'string',
  },
};

// ─── Validation ───

export function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

export function validateEntity(type, data) {
  const schema = schemas[type];
  if (!schema) return { valid: false, errors: [`Unknown entity type: ${type}`] };

  const errors = [];
  // Check required fields based on type
  const required = getRequiredFields(type);
  for (const field of required) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

function getRequiredFields(type) {
  const map = {
    organization: ['name'],
    provider: ['firstName', 'lastName', 'orgId'],
    license: ['providerId', 'state', 'status'],
    payer: ['name', 'category'],
    payer_plan: ['payerId', 'name', 'type'],
    application: ['providerId', 'payerId', 'state', 'status'],
    followup: ['applicationId', 'type', 'dueDate'],
    strategy_profile: ['name'],
    activity_log: ['applicationId', 'type', 'date'],
    task: ['title'],
    provider_education: ['providerId', 'institution'],
    board_certification: ['providerId', 'boardName'],
    work_history: ['providerId', 'employer'],
    malpractice_policy: ['providerId', 'carrierName'],
    provider_cme: ['providerId', 'courseName'],
    provider_reference: ['providerId', 'name'],
    provider_document: ['providerId', 'documentType'],
    exclusion_check: ['providerId'],
    org_contact: ['orgId', 'name'],
  };
  return map[type] || [];
}

// ─── Status Transitions ───

export const APPLICATION_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: '#64748b', bg: '#f1f5f9' },
  { value: 'submitted', label: 'Submitted', color: '#1d4ed8', bg: '#dbeafe' },
  { value: 'in_review', label: 'In Review', color: '#92400e', bg: '#fef3c7' },
  { value: 'pending_info', label: 'Pending Info', color: '#6b21a8', bg: '#f3e8ff' },
  { value: 'approved', label: 'Approved', color: '#166534', bg: '#dcfce7' },
  { value: 'denied', label: 'Denied', color: '#991b1b', bg: '#fee2e2' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#78716c', bg: '#f5f5f4' },
];

export const VALID_TRANSITIONS = {
  not_started: ['submitted', 'withdrawn'],
  submitted: ['in_review', 'pending_info', 'approved', 'denied', 'withdrawn'],
  in_review: ['pending_info', 'approved', 'denied', 'withdrawn'],
  pending_info: ['in_review', 'submitted', 'approved', 'denied', 'withdrawn'],
  approved: ['withdrawn'], // Rare but possible
  denied: ['submitted'],   // Can re-apply
  withdrawn: ['not_started', 'submitted'],
};

export const LICENSE_STATUSES = [
  { value: 'active', label: 'Active', color: '#166534', bg: '#dcfce7' },
  { value: 'pending', label: 'Pending', color: '#92400e', bg: '#fef3c7' },
  { value: 'expired', label: 'Expired', color: '#991b1b', bg: '#fee2e2' },
  { value: 'inactive', label: 'Inactive', color: '#64748b', bg: '#f1f5f9' },
];

export const FOLLOWUP_TYPES = [
  { value: 'status_check', label: 'Status Check' },
  { value: 'document_request', label: 'Document Request' },
  { value: 'info_response', label: 'Info Response' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'general', label: 'General' },
];

export const ACTIVITY_LOG_TYPES = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'portal_check', label: 'Portal Check' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'document', label: 'Document Sent/Received' },
  { value: 'note', label: 'Note' },
];
