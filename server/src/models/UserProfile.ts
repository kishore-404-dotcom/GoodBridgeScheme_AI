import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfileDocument extends Document {
  email?: string;
  mobile?: string;
  passwordHash?: string;
  fullName: string;
  age: number;
  gender: string;
  state: string;
  occupation: string;
  annualIncome: number;
  category: string;
  landHoldingAcres: number;
  hasDisability: boolean;
  isBPL: boolean;
  residenceType: string;
  savedSchemeIds: string[];
}

const UserProfileSchema: Schema = new Schema(
  {
    email: { type: String, unique: true, sparse: true },
    mobile: { type: String, unique: true, sparse: true },
    passwordHash: { type: String },
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, default: 'All' },
    state: { type: String, default: 'All India' },
    occupation: { type: String, default: 'General Citizen' },
    annualIncome: { type: Number, default: 250000 },
    category: { type: String, default: 'General' },
    landHoldingAcres: { type: Number, default: 0 },
    hasDisability: { type: Boolean, default: false },
    isBPL: { type: Boolean, default: false },
    residenceType: { type: String, default: 'All' },
    savedSchemeIds: [{ type: String }]
  },
  { timestamps: true }
);

export const UserProfileModel = mongoose.model<IUserProfileDocument>('UserProfile', UserProfileSchema);
