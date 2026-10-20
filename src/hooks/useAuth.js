import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setUserScope } from '../lib/userScope';

const AuthContext = createContext({ session: null, user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
        setUserScope(data.session?.user?.id);
        setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setUserScope(s?.user?.id);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: () => supabase.auth.signOut(),
  };
  return createElement(AuthContext.Provider, { value }, children);
}

export const useAuth = () => useContext(AuthContext);