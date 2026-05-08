/**
 * EnnHealth Credentialing Ops v2 — Provider & Organization Config
 *
 * Default provider and organization records.
 * In v2, multiple providers and orgs are first-class entities.
 */

export const DEFAULT_ORGANIZATION = {
  id: 'org_ennhealth',
  name: 'EnnHealth Psychiatry',
  npi: '1861107849',
  taxId: '92-1746886',
  address: {
    street: '1230 Okaley Seaver Dr, Suite 101',
    city: 'Clermont',
    state: 'FL',
    zip: '34711',
  },
  phone: '(407) 796-2406',
  email: 'contact@ennhealth.com',
  taxonomy: '2084P0800X', // Psychiatry & Neurology, Psychiatry
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const DEFAULT_PROVIDER = {
  id: 'prov_nmichel',
  orgId: 'org_ennhealth',
  firstName: 'Nageley',
  lastName: 'Michel',
  credentials: 'DNP, PMHNP-BC, FNP-BC',
  npi: '1093258642',
  taxonomy: '363LP0808X', // Nurse Practitioner, Psych/Mental Health
  specialty: 'Psychiatric Mental Health',
  email: 'nageleymichel@gmail.com',
  phone: '(407) 796-2406',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// ─── CNP/APRN Licenses — Updated 2026-03-10 ───
// Source: Nursys e-Notify Report + provider-confirmed state list
// 30 states total: 28 active + 2 pending (IL*, OK*)
// FL RN is MULTISTATE — authorizes RN practice in all compact states

export const DEFAULT_LICENSES = [
  // ── From Nursys e-Notify Report (with license numbers) ──
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'AK', status: 'active', licenseType: 'CNP', licenseNumber: '241960', issueDate: '2025-08-07', expirationDate: '2026-11-30', compactState: false, notes: 'Focus: Family + Psych/MH. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'AZ', status: 'active', licenseType: 'CNP', licenseNumber: '298306', issueDate: '2023-09-29', expirationDate: '2026-07-31', compactState: false, notes: 'Focus: Family Psych/MH. Rx: YES. Cert exp 09/14/2030.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'FL', status: 'active', licenseType: 'CNP', licenseNumber: 'APRN9245433', issueDate: '2016-04-15', expirationDate: '2026-07-31', compactState: false, notes: 'Home state. Focus: Psych/MH + Family. Rx: YES. RN is MULTISTATE.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'IA', status: 'active', licenseType: 'CNP', licenseNumber: 'G184558', issueDate: '2025-05-19', expirationDate: '2026-07-31', compactState: false, notes: 'Focus: Psych/MH. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'ID', status: 'active', licenseType: 'CNP', licenseNumber: '7871669', issueDate: '2025-07-17', expirationDate: '2027-08-31', compactState: false, notes: 'Focus: NP. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'KS', status: 'active', licenseType: 'CNP', licenseNumber: '53-84266-101', issueDate: '2025-04-15', expirationDate: '2027-10-31', compactState: false, notes: 'Focus: Psych/MH.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'MN', status: 'active', licenseType: 'CNP', licenseNumber: '13207', issueDate: '2025-08-07', expirationDate: '', compactState: false, notes: 'Provider confirmed active. Nursys showed "CONTACT BOARD" — may be resolved.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'MT', status: 'active', licenseType: 'CNP', licenseNumber: 'APRN218560', issueDate: '', expirationDate: '2026-12-31', compactState: false, notes: 'Focus: Family. Rx: YES. Cert exp 09/14/2030.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'ND', status: 'active', licenseType: 'CNP', licenseNumber: '202622', issueDate: '2025-07-07', expirationDate: '', compactState: false, notes: 'Provider confirmed active. Focus: Psych/MH.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'NM', status: 'active', licenseType: 'CNP', licenseNumber: '74998', issueDate: '2023-08-18', expirationDate: '2026-03-15', compactState: false, notes: 'Focus: Psych/MH. Rx: YES. Specialty exp 03/15/2026.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'NV', status: 'active', licenseType: 'CNP', licenseNumber: '883632', issueDate: '2024-12-13', expirationDate: '2026-10-12', compactState: false, notes: 'Focus: Psych/MH.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'OR', status: 'active', licenseType: 'CNP', licenseNumber: '10032628', issueDate: '2024-09-16', expirationDate: '2027-10-12', compactState: false, notes: 'Focus: Psych/MH. Rx: YES. Cert exp 09/14/2030.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'SD', status: 'active', licenseType: 'CNP', licenseNumber: 'CP003807', issueDate: '2025-09-04', expirationDate: '2030-09-14', compactState: false, notes: 'Focus: Family + Psych/MH. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'TX', status: 'active', licenseType: 'CNP', licenseNumber: '1185411', issueDate: '2025-01-06', expirationDate: '2027-10-31', compactState: false, notes: 'Focus: Psych/MH. Rx: YES. Cert exp 09/14/2030.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'VA', status: 'active', licenseType: 'CNP', licenseNumber: '0024195579', issueDate: '2025-12-04', expirationDate: '2027-10-31', compactState: false, notes: 'Focus: Psych/MH. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'VT', status: 'active', licenseType: 'CNP', licenseNumber: '101.0138011', issueDate: '2025-06-23', expirationDate: '2026-03-15', compactState: false, notes: 'Focus: Family + Psych/MH. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'WA', status: 'active', licenseType: 'CNP', licenseNumber: 'AP61476277', issueDate: '2024-09-20', expirationDate: '2027-10-12', compactState: false, notes: 'Focus: Family + Psych/MH.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'WV', status: 'active', licenseType: 'CNP', licenseNumber: '123920', issueDate: '2025-08-11', expirationDate: '2027-06-30', compactState: false, notes: 'Focus: Psych/MH. Rx: YES. No collaborative agreement required.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'WY', status: 'active', licenseType: 'CNP', licenseNumber: '56391', issueDate: '2025-06-26', expirationDate: '', compactState: false, notes: 'Provider confirmed active. Focus: Psych/MH.' },

  // ── Provider-confirmed active (not in Nursys e-Notify) ──
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'CA', status: 'active', licenseType: 'CNP', licenseNumber: 'NPF95033893', issueDate: '2025-02-05', expirationDate: '', compactState: false, notes: 'NP Furnishing Number. CA Dept of Consumer Affairs. Rx: YES.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'CO', status: 'active', licenseType: 'CNP', licenseNumber: 'C-RXN.0101891-C-NP', issueDate: '2024-09-12', expirationDate: '2026-09-30', compactState: true, notes: 'Compact NP - C-RXN. Psych/MH. CO Dept of Regulatory Agencies.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'CT', status: 'active', licenseType: 'CNP', licenseNumber: '14541', issueDate: '2025-02-23', expirationDate: '2025-10-31', compactState: false, notes: 'APRN. Dept of Public Health. Exp 10/31/2025 — may need renewal verification.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'DC', status: 'active', licenseType: 'CNP', licenseNumber: 'NP500327215', issueDate: '2025-10-07', expirationDate: '2027-10-31', compactState: false, notes: 'Nurse Practitioner. DC Dept of Health, Board of Medicine.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'MA', status: 'active', licenseType: 'CNP', licenseNumber: 'RN10023994', issueDate: '', expirationDate: '', compactState: false, notes: 'Certified NP Authorization. MA Dept of Public Health, Board of Registration in Nursing.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'MD', status: 'active', licenseType: 'CNP', licenseNumber: 'AC007801', issueDate: '2025-06-24', expirationDate: '2027-10-28', compactState: true, notes: 'AC-CRNP-PMH. Compact State Additional Cert. Original state FL. MD Board of Nursing.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'NH', status: 'active', licenseType: 'CNP', licenseNumber: 'AC007801', issueDate: '2025-06-24', expirationDate: '2027-10-28', compactState: true, notes: 'AC-CRNP-PMH. Compact State Additional Cert. Original state FL.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'NY', status: 'active', licenseType: 'CNP', licenseNumber: 'P00670', issueDate: '2025-01-24', expirationDate: '', compactState: false, notes: 'Nurse Practitioner in Psychiatry. Cert issued by NY Education Dept.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'UT', status: 'active', licenseType: 'CNP', licenseNumber: '14229038-4405', issueDate: '2025-07-08', expirationDate: '2028-01-31', compactState: false, notes: 'APRN. Psych/MH PMHNP-BC. UT Dept of Commerce.' },

  // ── Pending ──
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'IL', status: 'pending', licenseType: 'CNP', licenseNumber: '', issueDate: '', expirationDate: '', compactState: false, notes: 'Pending licensure.' },
  { providerId: 'prov_nmichel', providerName: 'Nageley Michel', npi: '1093258642', state: 'OK', status: 'pending', licenseType: 'CNP', licenseNumber: '226657', issueDate: '2025-12-18', expirationDate: '2026-10-31', compactState: false, notes: 'Pending per provider. Nursys shows APRN-only license active.' },
];

// ─── Summary (30 states) ───
// Active CNP (28): AK, AZ, CA, CO, CT, DC, FL, IA, ID, KS, MA, MD, MN, MT, ND, NH, NM, NV, NY, OR, SD, TX, UT, VA, VT, WA, WV, WY
// Pending (2): IL*, OK*
