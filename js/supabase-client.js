(function () {
  'use strict';

  if (!window.APP_CONFIG?.SUPABASE_URL || !window.APP_CONFIG?.SUPABASE_ANON_KEY) {
    console.error('Missing config.js — copy js/config.example.js to js/config.js');
    window.supabaseClient = null;
    return;
  }

  if (window.APP_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT')) {
    console.warn('Supabase is not configured yet. Update js/config.js.');
  }

  window.supabaseClient = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );
})();
