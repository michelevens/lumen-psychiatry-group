/**
 * EnnHealth Telehealth Strategy — State Telehealth Policies
 *
 * Comprehensive telehealth regulatory data per state.
 * Focused on psychiatric/mental health NP (PMHNP) telehealth practice.
 *
 * Fields:
 *   practiceAuthority: 'full' | 'reduced' | 'restricted'
 *     - full = independent practice, no collaborative agreement needed
 *     - reduced = collaborative agreement required but NP can practice
 *     - restricted = supervisory agreement, physician must be involved
 *   cpaNotes: string — collaborative practice agreement details
 *   telehealthParity: boolean — state requires telehealth reimbursement parity
 *   controlledSubstances: 'allowed' | 'limited' | 'prohibited'
 *     - allowed = can prescribe Schedule II-V via telehealth
 *     - limited = restrictions (e.g., no Schedule II, or initial in-person required)
 *     - prohibited = cannot prescribe controlled substances via telehealth
 *   csNotes: string — controlled substance prescribing details
 *   consentRequired: 'verbal' | 'written' | 'either' | 'none'
 *   consentNotes: string
 *   inPersonRequired: boolean — must have initial in-person visit before telehealth
 *   inPersonNotes: string
 *   originatingSite: 'any' | 'clinical' | 'varies'
 *     - any = patient can be at home
 *     - clinical = patient must be at approved facility
 *     - varies = depends on payer/program
 *   aprnCompact: boolean — state is member of APRN Compact
 *   nlcMember: boolean — state is member of Nurse Licensure Compact (NLC)
 *   medicaidTelehealth: 'full' | 'limited' | 'restricted'
 *   medicaidNotes: string
 *   audioOnly: boolean — state allows audio-only telehealth
 *   crossStateLicense: 'compact' | 'state_specific' | 'special_registration'
 *   ryanHaightExemption: boolean — state has DEA telehealth prescribing exemption
 *   lastUpdated: string — YYYY-MM-DD when this data was last verified
 *   notes: string — general notes
 *   readinessScore: number 1-10 — overall telehealth friendliness for PMHNP practice
 */

export const TELEHEALTH_POLICIES = [
  {
    state: 'AL', practiceAuthority: 'restricted', cpaNotes: 'Collaborative practice agreement with physician required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II requires established relationship',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: 'Live video only for most services', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Restrictive NP practice environment', readinessScore: 3,
  },
  {
    state: 'AK', practiceAuthority: 'full', cpaNotes: 'Full practice authority, no CPA needed',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe all schedules via telehealth',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: 'Telehealth parity for Medicaid', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Very telehealth-friendly but small population', readinessScore: 8,
  },
  {
    state: 'AZ', practiceAuthority: 'full', cpaNotes: 'Full practice authority after transition period',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Telehealth prescribing allowed including controlled substances',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: 'AHCCCS covers telehealth broadly', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Strong telehealth laws post-COVID', readinessScore: 9,
  },
  {
    state: 'AR', practiceAuthority: 'restricted', cpaNotes: 'Collaborative practice agreement required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II restrictions apply',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: 'Limited to specific service codes', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 4,
  },
  {
    state: 'CA', practiceAuthority: 'reduced', cpaNotes: 'Transition to full practice authority by 2026 (AB 890). Currently requires standardized procedures.',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe Schedule II-V via telehealth',
    consentRequired: 'verbal', consentNotes: 'Verbal consent documented in record', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: 'Medi-Cal covers telehealth at parity', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Largest state market. AB 890 expanding NP authority.', readinessScore: 7,
  },
  {
    state: 'CO', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'No restrictions on telehealth prescribing',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: 'Health First Colorado covers telehealth', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Excellent telehealth environment', readinessScore: 9,
  },
  {
    state: 'CT', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe controlled substances via telehealth',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'DE', practiceAuthority: 'full', cpaNotes: 'Full practice authority after 2 years collaboration',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'DC', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 9,
  },
  {
    state: 'FL', practiceAuthority: 'full', cpaNotes: 'Full practice authority as of 2020 (HB 607). 3,000 supervised hours required first.',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe Schedule II-V via telehealth. DEA registration required.',
    consentRequired: 'verbal', consentNotes: 'Verbal consent must be documented in medical record', inPersonRequired: false, inPersonNotes: 'No initial in-person visit required for telehealth',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: 'Florida Medicaid covers telehealth for behavioral health. Audio-only for established patients.',
    audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-03-01', notes: 'Home state. Strong telehealth laws post-COVID. Large Medicare Advantage population. Growing demand for telepsychiatry.', readinessScore: 9,
  },
  {
    state: 'GA', practiceAuthority: 'restricted', cpaNotes: 'Protocol agreement with physician required. Physician must be available.',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II requires established relationship',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: 'CMOs cover telehealth but policies vary', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Large market but restrictive NP practice laws', readinessScore: 4,
  },
  {
    state: 'HI', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Island geography makes telehealth critical', readinessScore: 8,
  },
  {
    state: 'ID', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Rural state with high telehealth need', readinessScore: 8,
  },
  {
    state: 'IL', practiceAuthority: 'full', cpaNotes: 'Full practice authority after 250 hours collaboration',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe controlled substances via telehealth',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Large market, good telehealth environment', readinessScore: 8,
  },
  {
    state: 'IN', practiceAuthority: 'reduced', cpaNotes: 'Collaborative agreement required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II limitations',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 5,
  },
  {
    state: 'IA', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'KS', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'KY', practiceAuthority: 'full', cpaNotes: 'Full practice authority after 4 years collaboration',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'High demand for telepsych in rural areas', readinessScore: 7,
  },
  {
    state: 'LA', practiceAuthority: 'restricted', cpaNotes: 'Collaborative practice agreement required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Physician involvement for Schedule II',
    consentRequired: 'written', consentNotes: 'Written consent required', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 3,
  },
  {
    state: 'ME', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 9,
  },
  {
    state: 'MD', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'MA', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: 'MassHealth covers telehealth broadly', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Strong behavioral health market', readinessScore: 9,
  },
  {
    state: 'MI', practiceAuthority: 'restricted', cpaNotes: 'Delegation agreement with physician required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II requires physician delegation',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Large market but restrictive practice laws', readinessScore: 4,
  },
  {
    state: 'MN', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 9,
  },
  {
    state: 'MS', practiceAuthority: 'restricted', cpaNotes: 'Collaborative practice agreement with physician required',
    telehealthParity: false, controlledSubstances: 'limited', csNotes: 'Significant restrictions on Schedule II',
    consentRequired: 'written', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'varies', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'restricted',
    medicaidNotes: 'Very limited Medicaid telehealth coverage', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'One of the most restrictive states', readinessScore: 2,
  },
  {
    state: 'MO', practiceAuthority: 'restricted', cpaNotes: 'Collaborative practice arrangement required. Geographic proximity rule.',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II limited by CPA',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'CPA geographic proximity requirement is a burden', readinessScore: 3,
  },
  {
    state: 'MT', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Very rural, high telehealth need', readinessScore: 8,
  },
  {
    state: 'NE', practiceAuthority: 'full', cpaNotes: 'Full practice authority after 2,000 hours',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 7,
  },
  {
    state: 'NV', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Growing market', readinessScore: 8,
  },
  {
    state: 'NH', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 9,
  },
  {
    state: 'NJ', practiceAuthority: 'full', cpaNotes: 'Full practice authority as of 2022 (P.L.2021 c.88)',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe via telehealth',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Good market, close to NY/PA', readinessScore: 8,
  },
  {
    state: 'NM', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'One of the first full practice authority states', readinessScore: 9,
  },
  {
    state: 'NY', practiceAuthority: 'reduced', cpaNotes: 'Collaborative agreement required. NP title protected.',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe under collaborative agreement',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: 'Broad Medicaid telehealth coverage', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Massive market but requires collaborative agreement', readinessScore: 6,
  },
  {
    state: 'NC', practiceAuthority: 'restricted', cpaNotes: 'Supervisory arrangement with physician required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II-III under supervision',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Large market but restrictive', readinessScore: 4,
  },
  {
    state: 'ND', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'OH', practiceAuthority: 'reduced', cpaNotes: 'Standard care arrangement required',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe under SCA',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Large population, decent telehealth laws', readinessScore: 6,
  },
  {
    state: 'OK', practiceAuthority: 'restricted', cpaNotes: 'Supervisory relationship with physician required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II-V under supervision',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 4,
  },
  {
    state: 'OR', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: 'Oregon Health Plan covers telehealth', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 9,
  },
  {
    state: 'PA', practiceAuthority: 'reduced', cpaNotes: 'Collaborative agreement required',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe under collaborative agreement',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Large market', readinessScore: 6,
  },
  {
    state: 'RI', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: false, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'SC', practiceAuthority: 'restricted', cpaNotes: 'Practice agreement with physician required',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II limited',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: '', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 4,
  },
  {
    state: 'SD', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'TN', practiceAuthority: 'restricted', cpaNotes: 'Supervisory relationship required. Must have physician within 75 miles.',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II under supervision',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: 'TennCare covers some telehealth', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '75-mile physician proximity rule is challenging for telehealth', readinessScore: 3,
  },
  {
    state: 'TX', practiceAuthority: 'restricted', cpaNotes: 'Prescriptive authority agreement with physician required. Physician delegation.',
    telehealthParity: true, controlledSubstances: 'limited', csNotes: 'Schedule II only with physician delegation at same site',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'limited',
    medicaidNotes: 'Texas Medicaid covers telehealth but policies vary by MCO', audioOnly: false,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Massive market but very restrictive NP practice laws. TBON actively lobbying for change.', readinessScore: 4,
  },
  {
    state: 'UT', practiceAuthority: 'full', cpaNotes: 'Full practice authority after consultation period',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 8,
  },
  {
    state: 'VT', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 9,
  },
  {
    state: 'VA', practiceAuthority: 'full', cpaNotes: 'Full practice authority after 5 years/practice agreement',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Good market near DC metro', readinessScore: 7,
  },
  {
    state: 'WA', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: 'Apple Health covers telehealth', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Progressive telehealth laws', readinessScore: 9,
  },
  {
    state: 'WV', practiceAuthority: 'full', cpaNotes: 'Full practice authority after 3 years collaboration',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'High behavioral health need', readinessScore: 7,
  },
  {
    state: 'WI', practiceAuthority: 'reduced', cpaNotes: 'Collaborative agreement required',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: 'Can prescribe under collaboration',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: '', readinessScore: 6,
  },
  {
    state: 'WY', practiceAuthority: 'full', cpaNotes: 'Full practice authority',
    telehealthParity: true, controlledSubstances: 'allowed', csNotes: '',
    consentRequired: 'verbal', consentNotes: '', inPersonRequired: false, inPersonNotes: '',
    originatingSite: 'any', aprnCompact: false, nlcMember: true, medicaidTelehealth: 'full',
    medicaidNotes: '', audioOnly: true,
    crossStateLicense: 'state_specific', ryanHaightExemption: false,
    lastUpdated: '2025-01-15', notes: 'Small population but very NP-friendly', readinessScore: 8,
  },
];

export function getPolicyByState(stateCode) {
  return TELEHEALTH_POLICIES.find(p => p.state === stateCode) || null;
}

export function getFullPracticeStates() {
  return TELEHEALTH_POLICIES.filter(p => p.practiceAuthority === 'full').map(p => p.state);
}

export function getTopReadinessStates(minScore = 7) {
  return TELEHEALTH_POLICIES
    .filter(p => p.readinessScore >= minScore)
    .sort((a, b) => b.readinessScore - a.readinessScore);
}

export function getRestrictedStates() {
  return TELEHEALTH_POLICIES.filter(p => p.practiceAuthority === 'restricted').map(p => p.state);
}
