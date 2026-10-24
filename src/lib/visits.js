import { supabase } from './supabase';

const FLAG = 'dn_visit_logged';

// One visit = one browser session (a reload or page change does not count again)
export const logVisit = async () => {
  try {
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, '1');
    await supabase.from('visits').insert({});
  } catch { /* statistics must never break the app */ }
};

export const fetchSiteStats = async () => {
  const { data, error } = await supabase.rpc('site_stats');
  if (error) throw error;
  return data;
};