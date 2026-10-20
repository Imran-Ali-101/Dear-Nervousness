// Name and photo come from Google / GitHub / LinkedIn (or the signup form)
export const getDisplayName = (user) => {
  const m = user?.user_metadata || {};
  return m.display_name || m.full_name || m.name || m.user_name || user?.email?.split('@')[0] || '';
};

export const getAvatarUrl = (user) => user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';