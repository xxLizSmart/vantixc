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
    btc_balance: toNumber(data.btc_balance),
    eth_balance: toNumber(data.eth_balance),
    usdc_balance: toNumber(data.usdc_balance),
    usdt_balance: toNumber(data.usdt_balance),
    xrp_balance: toNumber(data.xrp_balance),
    sol_balance: toNumber(data.sol_balance),
  } as Profile;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 6000);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(abort.signal)
        .maybeSingle();
      clearTimeout(timer);
      if (error) { console.error('[Auth] fetch error:', error.message); }
      else if (data) { return normalizeProfile(data); }
    } catch (e: any) {
      console.error('[Auth] fetch threw:', e?.message);
    }
    if (i < 2) await new Promise(r => setTimeout(r, 800));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef<string | null>(null);
  const fetchedRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const updateProfileLocally = (updates: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const d = await fetchProfile(user.id);
    if (d) setProfile(d);
  };

  const subscribe = (userId: string) => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); }
    channelRef.current = supabase
      .channel('profile_' + userId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + userId },
        async () => { const d = await fetchProfile(userId); if (d) setProfile(d); })
      .subscribe();
  };

  const unsubscribe = () => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  };

  useEffect(() => {
    let cancelled = false;
    const safety = setTimeout(() => { if (!cancelled) setLoading(false); }, 20000);

    const resolve = async (u: User, src: string) => {
      console.log('[Auth] resolve from', src, u.id.slice(0, 8));
      if (activeRef.current === u.id) { console.log('[Auth] dedup skip'); return; }
      activeRef.current = u.id;
      fetchedRef.current = false;
      if (!cancelled) setUser(u);
      const p = await fetchProfile(u.id);
      if (cancelled || activeRef.current !== u.id) return;
      if (p) { fetchedRef.current = true; setProfile(p); }
      subscribe(u.id);
      setLoading(false);
      clearTimeout(safety);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) resolve(session.user, 'getSession');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      console.log('[Auth] event:', event, session?.user?.id?.slice(0, 8) ?? 'none');
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user && !fetchedRef.current) {
          const p = await fetchProfile(session.user.id);
          if (p && !cancelled && activeRef.current === session.user.id) {
            fetchedRef.current = true; setProfile(p); setLoading(false); clearTimeout(safety);
          }
        }
        return;
      }
      if (session?.user) { await resolve(session.user, event); }
      else { activeRef.current = null; fetchedRef.current = false; setUser(null); setProfile(null); unsubscribe(); setLoading(false); clearTimeout(safety); }
    });

    return () => { cancelled = true; clearTimeout(safety); subscription.unsubscribe(); unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data: rpcData, error: rpcError } = await supabase.rpc('register_user', { p_email: email, p_password: password });
    if (!rpcError && rpcData) {
      const r = rpcData as { success?: boolean; error?: string; user_id?: string };
      if (r.error) { throw new Error(r.error.includes('already registered') || r.error.includes('unique') ? 'User already registered' : r.error); }
      if (r.success && r.user_id) {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        return;
      }
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const uid = data.user?.id ?? data.session?.user?.id;
    if (uid) {
      await supabase.from('profiles').upsert({ id: uid, username: email.split('@')[0], btc_balance: 0, eth_balance: 0, usdc_balance: 0, usdt_balance: 0, xrp_balance: 0, sol_balance: 0, kyc_status: 'not_verified' }, { onConflict: 'id', ignoreDuplicates: true });
    }
  };

  const signOut = async () => {
    activeRef.current = null; setUser(null); setProfile(null); unsubscribe();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile, updateProfileLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
