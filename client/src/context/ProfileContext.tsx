import React, { createContext, useContext, useState } from 'react';
import { UserProfile, Scheme } from '../../../shared/types';

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  savedSchemeIds: string[];
  toggleSaveScheme: (schemeId: string) => void;
  isSchemeSaved: (schemeId: string) => boolean;
  /** True once the citizen has run the eligibility check, so the chat can use their profile */
  profileConfirmed: boolean;
  confirmProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Citizen User',
  age: 25,
  gender: 'All',
  state: 'Uttar Pradesh',
  occupation: 'Farmer',
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
  isSchemeSaved: () => false,
  profileConfirmed: false,
  confirmProfile: () => {}
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

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
        isSchemeSaved,
        profileConfirmed,
        confirmProfile: () => setProfileConfirmed(true)
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
