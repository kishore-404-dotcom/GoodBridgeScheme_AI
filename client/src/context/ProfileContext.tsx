import React, { createContext, useContext, useState } from 'react';
import { UserProfile, Scheme } from '../../../shared/types';

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  savedSchemeIds: string[];
  toggleSaveScheme: (schemeId: string) => void;
  isSchemeSaved: (schemeId: string) => boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Citizen User',
  age: 25,
  gender: 'All',
  state: 'Uttar Pradesh',
  occupation: 'Small Farmer',
  annualIncome: 180000,
  category: 'OBC',
  landHoldingAcres: 1.5,
  hasDisability: false,
  isBPL: true,
  residenceType: 'Rural',
  savedSchemeIds: []
};

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  savedSchemeIds: [],
  toggleSaveScheme: () => {},
  isSchemeSaved: () => false
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>(['SCH-001', 'SCH-021', 'SCH-046']);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const toggleSaveScheme = (schemeId: string) => {
    setSavedSchemeIds((prev) =>
      prev.includes(schemeId) ? prev.filter((id) => id !== schemeId) : [...prev, schemeId]
    );
  };

  const isSchemeSaved = (schemeId: string) => savedSchemeIds.includes(schemeId);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        savedSchemeIds,
        toggleSaveScheme,
        isSchemeSaved
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
