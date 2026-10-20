import { supabase } from './supabase';

export const DELETE_AFTER_DAYS = 7;
const FLAG = 'deletion_requested_at';

// Saved in user_metadata; a daily database job removes accounts older than DELETE_AFTER_DAYS
const setFlag = (value) => supabase.auth.updateUser({ data: { [FLAG]: value } });
export const requestDeletion = () => setFlag(new Date().toISOString());
export const cancelDeletion = () => setFlag(null);

// Date when the account will be deleted, or null if no deletion is scheduled
export const getDeletionDate = (user) => {
  const at = user?.user_metadata?.[FLAG];
  const t = at ? new Date(at).getTime() : NaN;
  return Number.isFinite(t) ? new Date(t + DELETE_AFTER_DAYS * 864e5) : null;
};