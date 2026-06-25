(function () {
  'use strict';

  async function loadClinicInfo() {
    const { data, error } = await window.supabaseClient
      .from('clinic_info')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.warn('Could not load clinic info:', error.message);
      return;
    }

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el && value) el.textContent = value;
    };

    setText('clinic-name', data.name);
    setText('clinic-tagline', data.tagline);
    setText('clinic-address', data.address);
    setText('clinic-phone', data.phone);
    setText('clinic-email', data.email);
    setText('clinic-hours', data.hours);
    document.title = data.name;

    const emailLink = document.getElementById('clinic-email-link');
    if (emailLink && data.email) {
      emailLink.href = 'mailto:' + data.email;
      emailLink.textContent = data.email;
    }

    const footerName = document.getElementById('clinic-name-footer');
    if (footerName && data.name) footerName.textContent = data.name;
  }

  document.addEventListener('DOMContentLoaded', loadClinicInfo);
})();
