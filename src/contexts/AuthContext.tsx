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

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch profile — with one automatic retry ──────────────────────────────
  // On page reload, the Supabase JWT may not be fully verified yet when the
  // first fetch fires, causing RLS to reject it. A single 600 ms retry
  // covers the vast majority of transient cases without noticeable delay.
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error(`[AuthContext] fetchProfile attempt ${attempt + 1} error:`, error.message);
        } else if (data) {
          return normalizeProfile(data);
        } else {
          console.warn('[AuthContext] No profile row for user:', userId);
        }
      } catch (err) {
        console.error(`[AuthContext] fetchProfile attempt ${attempt + 1} threw:`, err);
      }

      // Wait before retrying
      if (attempt < 1) await new Promise(r => setTimeout(r, 600));
    }
    return null;
  };

  // Optimistic in-memory update — no DB call needed
  const updateProfileLocally = (updates: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const data = await fetchProfile(user.id);
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
          // Always re-fetch the full row — Realtime payloads can omit columns
          // that RLS restricts, so payload.new may be missing is_admin etc.
          const fresh = await fetchProfile(userId);
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
  const activeUserIdRef  = useRef<string | null>(null);
  // Tracks whether we successfully fetched a profile for the current user.
  // Used by the TOKEN_REFRESHED rescue path: if the initial fetch fired
  // before the JWT was refreshed (RLS returned nothing), we retry here.
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Safety net: if everything above fails, don't block the UI forever
    const safetyTimer = setTimeout(() => {
      console.warn('[AuthContext] safety timeout — forcing loading=false');
      if (!cancelled) setLoading(false);
    }, 8000);

    // ── Shared logic: fetch profile and finalise loading ───────────────────
    const resolveUser = async (currentUser: User) => {
      // Dedup: don't run two concurrent fetches for the same user.
      // On reload Supabase fires INITIAL_SESSION then SIGNED_IN for the same
      // user — we only want the first one to do the work.
      if (activeUserIdRef.current === currentUser.id) return;
      activeUserIdRef.current = currentUser.id;
      profileFetchedRef.current = false;

      if (!cancelled) setUser(currentUser);

      const p = await fetchProfile(currentUser.id);

      if (cancelled) return;
      if (activeUserIdRef.current !== currentUser.id) return; // superseded

      if (p) {
        profileFetchedRef.current = true;
        setProfile(p);
      }
      subscribeToProfile(currentUser.id);
      setLoading(false);
      clearTimeout(safetyTimer);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      console.log('[AuthContext] event:', event, '| user:', session?.user?.id ?? 'none');

      if (event === 'TOKEN_REFRESHED') {
        // Rescue: initial fetch may have run with an expired JWT (RLS returned
        // nothing). Now that the token is fresh, retry if we still have no profile.
        if (session?.user && !profileFetchedRef.current) {
          console.log('[AuthContext] TOKEN_REFRESHED rescue — retrying fetchProfile');
          const p = await fetchProfile(session.user.id);
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
        await resolveUser(session.user);
      } else {
        // Signed out / no session
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
    // onAuthStateChange SIGNED_IN fires → resolveUser → profile loaded
  };

  const signUp = async (email: string, password: string) => {
    // Strategy 1: SECURITY DEFINER RPC — skips email confirmation
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

    // Strategy 2: standard signUp fallback
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
