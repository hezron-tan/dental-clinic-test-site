(function () {
  'use strict';

  const Auth = {
    async getSession() {
      const { data, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async getProfile() {
      const session = await this.getSession();
      if (!session) return null;

      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },

    async signOut() {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
    },

    async requireRole(allowedRoles, redirectTo) {
      const profile = await this.getProfile();
      if (!profile || !allowedRoles.includes(profile.role)) {
        window.location.href = redirectTo || '../login.html';
        return null;
      }
      return profile;
    },

    dashboardPathForRole(role) {
      return role === 'admin' ? '../admin/' : '../staff/';
    }
  };

  window.Auth = Auth;
})();
