import mongoose, { Schema, Document } from 'mongoose';

export interface ISchemeDocument extends Document {
  schemeId: string;
  name: string;
  category: string;
  level: 'Central' | 'State';
  ministryOrDepartment: string;
  description: string;
  summaryText: string;
  financialBenefit: string;
  financialBenefitAmount: number;
  eligibilityRules: {
    minAge?: number;
    maxAge?: number;
    maxIncome?: number;
    minLandHoldingAcres?: number;
    maxLandHoldingAcres?: number;
    genderAllowed?: string[];
    statesAllowed?: string[];
    occupationsAllowed?: string[];
    categoriesAllowed?: string[];
    disabilityRequired?: boolean;
    bplRequired?: boolean;
    urbanRural?: string;
  };
  documentsRequired: string[];
  applicationUrl: string;
  applicationSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
  }>;
  tags: string[];
  isVerified: boolean;
  lastCheckedDate: string;
}

const SchemeSchema: Schema = new Schema(
  {
    schemeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ['Central', 'State'], default: 'Central' },
    ministryOrDepartment: { type: String, required: true },
    description: { type: String, required: true },
    summaryText: { type: String, required: true },
    financialBenefit: { type: String, required: true },
    financialBenefitAmount: { type: Number, default: 0 },
    eligibilityRules: {
      minAge: { type: Number },
      maxAge: { type: Number },
      maxIncome: { type: Number },
      minLandHoldingAcres: { type: Number },
      maxLandHoldingAcres: { type: Number },
      genderAllowed: [{ type: String }],
      statesAllowed: [{ type: String }],
      occupationsAllowed: [{ type: String }],
      categoriesAllowed: [{ type: String }],
      disabilityRequired: { type: Boolean, default: false },
      bplRequired: { type: Boolean, default: false },
      urbanRural: { type: String, default: 'All' }
    },
    documentsRequired: [{ type: String }],
    applicationUrl: { type: String, required: true },
    applicationSteps: [
      {
        stepNumber: { type: Number },
        title: { type: String },
        description: { type: String }
      }
    ],
    tags: [{ type: String }],
    isVerified: { type: Boolean, default: true },
    lastCheckedDate: { type: String, default: '19 Aug 2026' }
  },
  { timestamps: true }
);

export const SchemeModel = mongoose.model<ISchemeDocument>('Scheme', SchemeSchema);
