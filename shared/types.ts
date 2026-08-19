/**
 * GoodSchemeAI - Shared TypeScript Type Definitions
 * Unified data contract between Client (React) and Server (Node.js/Express)
 */

export type SchemeCategory =
  | 'Student / Education'
  | 'Agriculture / Farmers'
  | 'Entrepreneurship / MSME'
  | 'Women / Family Welfare'
  | 'Senior Citizens / Social Welfare'
  | 'Employment / Skill Development';

export type TargetGender = 'All' | 'Female' | 'Male' | 'Transgender';
export type UrbanRuralOption = 'All' | 'Urban' | 'Rural';
export type SocialCategory = 'All' | 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Minority';

export interface EligibilityRules {
  minAge?: number;
  maxAge?: number;
  maxIncome?: number; // Annual income cap in INR
  minLandHoldingAcres?: number;
  maxLandHoldingAcres?: number;
  genderAllowed?: TargetGender[];
  statesAllowed?: string[]; // Array of State names or ['All India']
  occupationsAllowed?: string[];
  categoriesAllowed?: SocialCategory[];
  disabilityRequired?: boolean;
  bplRequired?: boolean;
  urbanRural?: UrbanRuralOption;
}

export interface SchemeStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface MultilingualTranslation {
  hi?: { name: string; description: string; summary: string };
  ta?: { name: string; description: string; summary: string };
  te?: { name: string; description: string; summary: string };
  mr?: { name: string; description: string; summary: string };
  bn?: { name: string; description: string; summary: string };
  kn?: { name: string; description: string; summary: string };
  gu?: { name: string; description: string; summary: string };
  ml?: { name: string; description: string; summary: string };
  pa?: { name: string; description: string; summary: string };
}

export interface Scheme {
  _id?: string;
  schemeId: string; // e.g. SCH-001
  name: string;
  category: SchemeCategory;
  level: 'Central' | 'State';
  ministryOrDepartment: string;
  description: string;
  summaryText: string;
  financialBenefit: string;
  financialBenefitAmount: number; // For calculator sorting
  eligibilityRules: EligibilityRules;
  documentsRequired: string[];
  applicationUrl: string;
  applicationSteps: SchemeStep[];
  tags: string[];
  translations?: MultilingualTranslation;
  isVerified: boolean;
  lastCheckedDate: string;
}

export interface UserProfile {
  id?: string;
  fullName: string;
  age: number;
  gender: TargetGender;
  state: string;
  occupation: string;
  annualIncome: number;
  category: SocialCategory;
  landHoldingAcres: number;
  hasDisability: boolean;
  isBPL: boolean;
  residenceType: UrbanRuralOption;
  savedSchemeIds?: string[];
}

export interface CriterionStatus {
  criterion: string;
  isMet: boolean;
  details: string;
}

export interface EligibilityEvaluationResult {
  scheme: Scheme;
  matchScorePercentage: number;
  isEligible: boolean;
  criteriaMet: CriterionStatus[];
  criteriaFailed: CriterionStatus[];
  missingDocuments: string[];
  aiSimplifiedExplanation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language: string;
  timestamp: string;
  suggestedSchemes?: Scheme[];
  audioPlaybackAvailable?: boolean;
}

export interface DocumentVerificationStatus {
  documentName: string;
  isAvailable: boolean;
  statusText: string;
  recommendedAction: string;
}

export interface ApplicationDraft {
  schemeId: string;
  schemeName: string;
  applicantName: string;
  language: string;
  prefilledFields: Record<string, string>;
  checklist: DocumentVerificationStatus[];
  generatedDate: string;
}
