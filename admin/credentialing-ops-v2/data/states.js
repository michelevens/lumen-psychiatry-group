/**
 * EnnHealth Credentialing Ops v2 — States Configuration
 *
 * Canonical state list with licensure status and metadata.
 * This drives which states appear in forms, batch generators, and strategy profiles.
 */

// Population estimates (2025 US Census Bureau projections, in thousands)
export const STATES = [
  { code: 'AL', name: 'Alabama', region: 'southeast', pop: 5108 },
  { code: 'AK', name: 'Alaska', region: 'pacific_nw', pop: 734 },
  { code: 'AZ', name: 'Arizona', region: 'west', pop: 7578 },
  { code: 'AR', name: 'Arkansas', region: 'south', pop: 3068 },
  { code: 'CA', name: 'California', region: 'west', pop: 38965 },
  { code: 'CO', name: 'Colorado', region: 'west', pop: 5915 },
  { code: 'CT', name: 'Connecticut', region: 'northeast', pop: 3617 },
  { code: 'DE', name: 'Delaware', region: 'northeast', pop: 1018 },
  { code: 'DC', name: 'District of Columbia', region: 'northeast', pop: 679 },
  { code: 'FL', name: 'Florida', region: 'southeast', pop: 23372 },
  { code: 'GA', name: 'Georgia', region: 'southeast', pop: 11029 },
  { code: 'HI', name: 'Hawaii', region: 'west', pop: 1436 },
  { code: 'ID', name: 'Idaho', region: 'pacific_nw', pop: 2001 },
  { code: 'IL', name: 'Illinois', region: 'midwest', pop: 12516 },
  { code: 'IN', name: 'Indiana', region: 'midwest', pop: 6876 },
  { code: 'IA', name: 'Iowa', region: 'midwest', pop: 3207 },
  { code: 'KS', name: 'Kansas', region: 'midwest', pop: 2937 },
  { code: 'KY', name: 'Kentucky', region: 'southeast', pop: 4526 },
  { code: 'LA', name: 'Louisiana', region: 'south', pop: 4590 },
  { code: 'ME', name: 'Maine', region: 'northeast', pop: 1396 },
  { code: 'MD', name: 'Maryland', region: 'northeast', pop: 6180 },
  { code: 'MA', name: 'Massachusetts', region: 'northeast', pop: 7001 },
  { code: 'MI', name: 'Michigan', region: 'midwest', pop: 10037 },
  { code: 'MN', name: 'Minnesota', region: 'midwest', pop: 5787 },
  { code: 'MS', name: 'Mississippi', region: 'south', pop: 2940 },
  { code: 'MO', name: 'Missouri', region: 'midwest', pop: 6196 },
  { code: 'MT', name: 'Montana', region: 'west', pop: 1133 },
  { code: 'NE', name: 'Nebraska', region: 'midwest', pop: 1978 },
  { code: 'NV', name: 'Nevada', region: 'west', pop: 3194 },
  { code: 'NH', name: 'New Hampshire', region: 'northeast', pop: 1402 },
  { code: 'NJ', name: 'New Jersey', region: 'northeast', pop: 9290 },
  { code: 'NM', name: 'New Mexico', region: 'west', pop: 2115 },
  { code: 'NY', name: 'New York', region: 'northeast', pop: 19571 },
  { code: 'NC', name: 'North Carolina', region: 'southeast', pop: 10835 },
  { code: 'ND', name: 'North Dakota', region: 'midwest', pop: 783 },
  { code: 'OH', name: 'Ohio', region: 'midwest', pop: 11780 },
  { code: 'OK', name: 'Oklahoma', region: 'south', pop: 4019 },
  { code: 'OR', name: 'Oregon', region: 'pacific_nw', pop: 4233 },
  { code: 'PA', name: 'Pennsylvania', region: 'northeast', pop: 12972 },
  { code: 'RI', name: 'Rhode Island', region: 'northeast', pop: 1095 },
  { code: 'SC', name: 'South Carolina', region: 'southeast', pop: 5373 },
  { code: 'SD', name: 'South Dakota', region: 'midwest', pop: 919 },
  { code: 'TN', name: 'Tennessee', region: 'southeast', pop: 7126 },
  { code: 'TX', name: 'Texas', region: 'south', pop: 30503 },
  { code: 'UT', name: 'Utah', region: 'west', pop: 3417 },
  { code: 'VT', name: 'Vermont', region: 'northeast', pop: 648 },
  { code: 'VA', name: 'Virginia', region: 'southeast', pop: 8683 },
  { code: 'WA', name: 'Washington', region: 'pacific_nw', pop: 7812 },
  { code: 'WV', name: 'West Virginia', region: 'southeast', pop: 1770 },
  { code: 'WI', name: 'Wisconsin', region: 'midwest', pop: 5893 },
  { code: 'WY', name: 'Wyoming', region: 'west', pop: 577 },
];

export const REGIONS = [
  { value: 'northeast', label: 'Northeast' },
  { value: 'southeast', label: 'Southeast' },
  { value: 'midwest', label: 'Midwest' },
  { value: 'south', label: 'South' },
  { value: 'west', label: 'West / Mountain' },
  { value: 'pacific_nw', label: 'Pacific Northwest' },
];

export function getStateByCode(code) {
  return STATES.find(s => s.code === code) || null;
}

export function getStatesByRegion(region) {
  return STATES.filter(s => s.region === region);
}

export function getStateName(code) {
  if (code === 'ALL') return 'All States (National)';
  const s = getStateByCode(code);
  return s ? s.name : code;
}

// Population in thousands
export const US_TOTAL_POP = STATES.reduce((sum, s) => sum + (s.pop || 0), 0);

export function getStatePop(code) {
  if (code === 'ALL') return US_TOTAL_POP;
  const s = getStateByCode(code);
  return s ? (s.pop || 0) : 0;
}
