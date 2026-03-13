import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, toNumber } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileLocally: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeProfile(data: any): Profile {
  return {
    ...data,
    btc_balance:  toNumber(data.btc_balance),
    eth_balance:  toNumber(data.eth_balance),
    usdc_balance: toNumber(data.usdc_balance),
    usdt_balance: toNumber(data.usdt_balance),
    xrp_balance:  toNumber(data.xrp_balance),
    sol_balance:  toNumber(data.sol_balance),
  } as Profile;
}

const fetchProfileWithTimeout = async (userId: string): Promise<Profile | null> => {
  const TIMEOUT_MS = 6000;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[AuthContext] fetchProfile attempt ${attempt + 1} for`, userId.slice(0, 8));
      const timeoutPromise = new Promise<null>((_, reject) =>
