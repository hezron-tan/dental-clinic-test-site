(function () {
  'use strict';

  const CONFIG_ERROR =
    'Supabase is not configured. Copy js/config.example.js to js/config.js or run npm run config.';

  const Auth = {
    isConfigured() {
      return Boolean(window.supabaseClient);
    },

    async getSession() {
      if (!this.isConfigured()) return null;
      const { data, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async getProfile() {
      if (!this.isConfigured()) return null;
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
      if (!this.isConfigured()) {
        throw new Error(CONFIG_ERROR);
      }
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },

    async signOut() {
      if (!this.isConfigured()) return;
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
    },

    async requireRole(allowedRoles, redirectTo) {
      if (!this.isConfigured()) {
        window.location.href = redirectTo || App.siteUrl('login.html');
        return null;
      }

      try {
        const profile = await this.getProfile();
        if (!profile || !allowedRoles.includes(profile.role)) {
          window.location.href = redirectTo || App.siteUrl('login.html');
          return null;
        }
        return profile;
      } catch (err) {
        console.error(err);
        window.location.href = redirectTo || App.siteUrl('login.html');
        return null;
      }
    },

    dashboardPathForRole(role) {
      return App.siteUrl(role === 'admin' ? 'admin/' : 'staff/');
    },

    configErrorMessage() {
      return CONFIG_ERROR;
    }
  };

  window.Auth = Auth;
})();
