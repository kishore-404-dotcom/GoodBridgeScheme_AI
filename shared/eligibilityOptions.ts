import { Scheme, SchemeCategory } from './types';

/**
 * Answer options for the guided eligibility assessment.
 * Shared so the client wizard and the server ranking use the same definitions.
 */

/** Step 1 roles. `occupation` is the value the rule engine matches against scheme rules. */
export const ROLE_OPTIONS = [
  { id: 'student', occupation: 'Student' },
  { id: 'farmer', occupation: 'Farmer' },
  { id: 'business', occupation: 'Self-Employed' },
  { id: 'artisan', occupation: 'Artisan' },
  { id: 'worker', occupation: 'Rural Laborer' },
  { id: 'jobSeeker', occupation: 'Job Seeker' },
  { id: 'homemaker', occupation: 'Homemaker' },
  { id: 'salaried', occupation: 'Salaried Employee' },
  { id: 'senior', occupation: 'Senior Citizen' }
] as const;

export type RoleId = (typeof ROLE_OPTIONS)[number]['id'];

/**
 * Income bands, aligned with common scheme cut-offs (₹2.5 lakh scholarships, ₹8 lakh EWS/OBC).
 * `assumedIncome` is the band's upper limit, so we never claim eligibility the citizen might not have.
 */
export const INCOME_BANDS = [
  { id: 'below1', assumedIncome: 100000 },
  { id: '1to2_5', assumedIncome: 250000 },
  { id: '2_5to5', assumedIncome: 500000 },
  { id: '5to8', assumedIncome: 800000 },
  { id: 'above8', assumedIncome: 1500000 }
] as const;

export type IncomeBandId = (typeof INCOME_BANDS)[number]['id'];

export const EDUCATION_LEVELS = ['none', 'upto8', '10th', '12th', 'graduate', 'postgraduate'] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

/** Step 5 interests: matched against scheme category, or keywords in name/tags */
export const INTEREST_OPTIONS: { id: string; categories: SchemeCategory[]; keywords: string[] }[] = [
  { id: 'education', categories: ['Student / Education'], keywords: ['scholarship'] },
  { id: 'jobs', categories: ['Employment / Skill Development'], keywords: ['skill', 'employment'] },
  { id: 'agriculture', categories: ['Agriculture / Farmers'], keywords: ['farmer', 'crop'] },
  { id: 'business', categories: ['Entrepreneurship / MSME'], keywords: ['loan', 'business'] },
  { id: 'women', categories: ['Women / Family Welfare'], keywords: ['girl', 'women', 'maternity'] },
  { id: 'pension', categories: ['Senior Citizens / Social Welfare'], keywords: ['pension'] },
  // Not plain 'health': it would match "Soil Health Card"
  { id: 'health', categories: [], keywords: ['health cover', 'health insurance', 'hospital', 'treatment', 'medical'] }
];

export const MAX_INTERESTS = 3;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

/** Returns the ids of the citizen's interests that this scheme serves */
export const matchingInterests = (scheme: Scheme, interestIds: string[] = []): string[] => {
  const text = `${scheme.name} ${scheme.tags.join(' ')}`.toLowerCase();
  return INTEREST_OPTIONS.filter(
    (opt) =>
      interestIds.includes(opt.id) &&
      (opt.categories.includes(scheme.category) || opt.keywords.some((k) => text.includes(k)))
  ).map((opt) => opt.id);
};
