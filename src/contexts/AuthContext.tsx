import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, toNumber } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// Fetch profile with a 6-second hard timeout per attempt so it never hangs forever
const fetchProfileWithTimeout = async (userId: string): Promise<Profile | null> => {
  const TIMEOUT_MS = 6000;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[AuthContext] fetchProfile attempt ${attempt + 1} for`, userId.slice(0, 8));

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('FETCH_TIMEOUT')), TIMEOUT_MS)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        });

      const data = await Promise.race([fetchPromise, timeoutPromise]);

      if (data) {
        console.log('[AuthContext] fetchProfile success, is_admin:', (data as any).is_admin);
        return normalizeProfile(data);
      }
      console.warn('[AuthContext] fetchProfile: no profile row for', userId.slice(0, 8));
    } catch (err: any) {
      if (err?.message === 'FETCH_TIMEOUT') {
        console.error(`[AuthContext] fetchProfile attempt ${attempt + 1} TIMED OUT after ${TIMEOUT_MS}ms`);
      } else {
        console.error(`[AuthContext] fetchProfile attempt ${attempt + 1} error:`, err?.message, err?.code);
      }
    }

    if (attempt < 2) {
      console.log(`[AuthContext] fetchProfile waiting before retry ${attempt + 2}...`);
      await new Promise(r => setTimeout(r, 800));
    }
  }

  console.error('[AuthContext] fetchProfile: all attempts failed');
  return null;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfileLocally = (updates: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const data = await fetchProfileWithTimeout(user.id);
    if (data) setProfile(data);
  };

  // ── Realtime profile subscription ─────────────────────────────────────────
  const profileChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribeToProfile = (userId: string) => {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
      profileChannelRef.current = null;
    }
    const channel = supabase
      .channel(`profile_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        async () => {
          const fresh = await fetchProfileWithTimeout(userId);
          if (fresh) setProfile(fresh);
        }
      )
      .subscribe();
    profileChannelRef.current = channel;
  };

  const unsubscribeFromProfile = () => {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
      profileChannelRef.current = null;
    }
  };

  // ── Session initialisation ────────────────────────────────────────────────
  const activeUserIdRef   = useRef<string | null>(null);
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const safetyTimer = setTimeout(() => {
      console.warn('[AuthContext] safety timeout — forcing loading=false');
      if (!cancelled) setLoading(false);
    }, 25000);

    // ── Shared logic: fetch profile and finalise loading ───────────────────
    const resolveUser = async (currentUser: User, source: string) => {
      console.log(`[AuthContext] resolveUser(${source}) activeRef=${activeUserIdRef.current?.slice(0,8) ?? 'null'} userId=${currentUser.id.slice(0,8)}`);

      if (activeUserIdRef.current === currentUser.id) {
        console.log('[AuthContext] resolveUser DEDUP skip');
        return;
      }
      activeUserIdRef.current = currentUser.id;
      profileFetchedRef.current = false;

      if (!cancelled) setUser(currentUser);

      const p = await fetchProfileWithTimeout(currentUser.id);
      console.log('[AuthContext] resolveUser fetchProfile returned:', p ? `ok (is_admin=${(p as any).is_admin})` : 'null');

      if (cancelled) return;
      if (activeUserIdRef.current !== currentUser.id) return;

      if (p) {
        profileFetchedRef.current = true;
        setProfile(p);
      }
      subscribeToProfile(currentUser.id);
      setLoading(false);
      clearTimeout(safetyTimer);
    };

    // Also try getSession immediately for environments where INITIAL_SESSION is delayed/skipped
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      console.log('[AuthContext] getSession found user:', session.user.id.slice(0, 8));
      resolveUser(session.user, 'getSession');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      console.log('[AuthContext] event:', event, '| user:', session?.user?.id?.slice(0,8) ?? 'none');

      if (event === 'TOKEN_REFRESHED') {
        if (session?.user && !profileFetchedRef.current) {
          console.log('[AuthContext] TOKEN_REFRESHED rescue');
          const p = await fetchProfileWithTimeout(session.user.id);
          if (p && !cancelled && activeUserIdRef.current === session.user.id) {
            profileFetchedRef.current = true;
            setProfile(p);
            setLoading(false);
            clearTimeout(safetyTimer);
          }
        }
        return;
      }

      if (session?.user) {
        await resolveUser(session.user, event);
      } else {
        console.log('[AuthContext] no session — clearing state');
        activeUserIdRef.current = null;
        profileFetchedRef.current = false;
        setUser(null);
        setProfile(null);
        unsubscribeFromProfile();
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      unsubscribeFromProfile();
    };
  }, []);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('register_user', { p_email: email, p_password: password });

    if (!rpcError && rpcData) {
      const result = rpcData as { success?: boolean; error?: string; user_id?: string };
      if (result.error) {
        if (result.error.includes('already registered') || result.error.includes('unique')) {
          throw new Error('User already registered');
        }
        throw new Error(result.error);
      }
      if (result.success && result.user_id) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        return;
      }
    }

    console.warn('[AuthContext] register_user RPC not found, falling back to standard signUp');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const userId = data.user?.id ?? data.session?.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        username: email.split('@')[0],
        btc_balance: 0, eth_balance: 0, usdc_balance: 0,
        usdt_balance: 0, xrp_balance: 0, sol_balance: 0,
        kyc_status: 'not_verified',
      }, { onConflict: 'id', ignoreDuplicates: true });
    }
  };

  const signOut = async () => {
    activeUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    unsubscribeFromProfile();
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[AuthContext] signOut error:', error.message);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signOut,
      refreshProfile, updateProfileLocally,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
