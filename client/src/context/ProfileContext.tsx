import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../../../shared/types';
import { readStore, writeStore } from '../utils/storage';

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  /** True once the citizen has run the eligibility check, so the chat can use their profile */
  profileConfirmed: boolean;
  confirmProfile: () => void;
  resetProfile: () => void;
}

export const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Citizen User',
  age: 25,
  gender: 'All',
  state: '',
  occupation: '',
  annualIncome: 0,
  category: 'General',
  landHoldingAcres: 0,
  hasDisability: false,
  isBPL: false,
  residenceType: 'Rural',
  interests: []
};

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  profileConfirmed: false,
  confirmProfile: () => {},
  resetProfile: () => {}
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Answers survive a page refresh via localStorage
  const [profile, setProfile] = useState<UserProfile>(() => ({ ...DEFAULT_PROFILE, ...readStore('profile', {}) }));
  const [profileConfirmed, setProfileConfirmed] = useState<boolean>(() => readStore('profileConfirmed', false));

  useEffect(() => writeStore('profile', profile), [profile]);
  useEffect(() => writeStore('profileConfirmed', profileConfirmed), [profileConfirmed]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        profileConfirmed,
        confirmProfile: () => setProfileConfirmed(true),
        resetProfile: () => {
          setProfile(DEFAULT_PROFILE);
          setProfileConfirmed(false);
        }
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
