(function () {
  'use strict';

  const PAGE_SIZE = 10;

  let allPatients = [];
  let currentPage = 1;
  let currentPatientId = null;

  async function loadStorageWarning() {
    try {
      const { data, error } = await window.supabaseClient.rpc('get_storage_usage');
      if (error) return;

      const banner = document.getElementById('storage-banner');
      if (!banner) return;

      if (data.used_percent >= 50) {
        banner.hidden = false;
        banner.className = 'alert alert-warning storage-banner';
        banner.textContent =
          'Storage warning: ' + data.used_percent + '% of free tier used (' +
          App.formatBytes(data.used_bytes) + ' / ' + App.formatBytes(data.max_bytes) + '). ' +
          'Consider running supabase/reset.sql to clear test data.';
        banner.setAttribute('data-testid', 'storage-warning');
      }
    } catch (err) {
      console.warn('Storage check failed:', err);
    }
  }

  async function loadClinicForm() {
    const { data, error } = await window.supabaseClient
      .from('clinic_info')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw error;

    const form = document.getElementById('clinic-form');
    form.name.value = data.name;
    form.tagline.value = data.tagline;
    form.address.value = data.address;
    form.phone.value = data.phone;
    form.email.value = data.email;
    form.hours.value = data.hours;
  }

  async function saveClinicForm(e) {
    e.preventDefault();
    App.hideAlert('admin-alert');
    const form = e.target;

    try {
      const { error } = await window.supabaseClient
        .from('clinic_info')
        .update({
          name: form.name.value.trim(),
          tagline: form.tagline.value.trim(),
          address: form.address.value.trim(),
          phone: form.phone.value.trim(),
          email: form.email.value.trim(),
          hours: form.hours.value.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
      if (error) throw error;
      App.showAlert('admin-alert', 'Clinic information saved.', 'success');
    } catch (err) {
      App.handleError('admin-alert', err);
    }
  }

  function renderPagination(total, totalPages, start, shown) {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (!total) {
      pageInfo.textContent = 'No patients to display';
    } else {
      const from = start + 1;
      const to = start + shown;
      pageInfo.textContent =
        'Showing ' + from + '–' + to + ' of ' + total +
        ' · Page ' + currentPage + ' of ' + totalPages;
    }

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function renderPatientTable() {
    const tbody = document.querySelector('#patient-table tbody');
    const total = allPatients.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pagePatients = allPatients.slice(start, start + PAGE_SIZE);

    if (!pagePatients.length) {
      tbody.innerHTML = '<tr><td colspan="4">No patients found.</td></tr>';
    } else {
      tbody.innerHTML = pagePatients.map(function (p) {
        return '<tr data-testid="patient-row" data-patient-id="' + p.id + '">' +
          '<td>' + App.escapeHtml(p.last_name + ', ' + p.first_name) + '</td>' +
          '<td>' + App.escapeHtml(p.phone || '—') + '</td>' +
          '<td>' + App.escapeHtml(p.email || '—') + '</td>' +
          '<td><button type="button" class="button small edit-patient" data-id="' + p.id + '" data-testid="edit-patient">Edit</button> ' +
          '<button type="button" class="button small delete-patient" data-id="' + p.id + '" data-testid="delete-patient">Delete</button></td>' +
          '</tr>';
      }).join('');
    }

    renderPagination(total, totalPages, start, pagePatients.length);
  }

  async function loadPatients(preservePage) {
    allPatients = await Patients.list();
    if (!preservePage) {
      currentPage = 1;
    }
    renderPatientTable();
  }

  function hidePatientModal() {
    const overlay = document.getElementById('patient-form-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    currentPatientId = null;
  }

  function showPatientForm(patient) {
    const overlay = document.getElementById('patient-form-overlay');
    const form = document.getElementById('patient-form');
    form.reset();
    currentPatientId = patient ? patient.id : null;
    document.getElementById('patient-form-title').textContent =
      patient ? 'Edit Patient' : 'Add Patient';
    if (patient) Patients.fillForm(form, patient);

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const firstField = form.querySelector('[name="first_name"]');
    if (firstField) firstField.focus();
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      const isActive = panel.id === 'tab-' + tabId;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    });
  }

  async function savePatientForm(e) {
    e.preventDefault();
    App.hideAlert('admin-alert');
    const payload = Patients.formToPatient(e.target);

    const isEdit = !!currentPatientId;

    try {
      if (currentPatientId) {
        await Patients.update(currentPatientId, payload);
      } else {
        await Patients.create(payload);
      }
      document.getElementById('patient-form').reset();
      hidePatientModal();
      await loadPatients(isEdit);
      App.showAlert('admin-alert', 'Patient saved.', 'success');
    } catch (err) {
      App.handleError('admin-alert', err);
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const profile = await Auth.requireRole(['admin']);
    if (!profile) return;

    document.getElementById('user-greeting').textContent =
      'Hello, ' + (profile.display_name || 'Admin');
    document.getElementById('user-role').textContent = profile.role;
    document.getElementById('user-role').className = 'badge badge-admin';

    document.getElementById('logout-btn').addEventListener('click', async function () {
      await Auth.signOut();
      window.location.href = App.siteUrl('login.html');
    });

    document.getElementById('clinic-form').addEventListener('submit', saveClinicForm);
    document.getElementById('patient-form').addEventListener('submit', savePatientForm);

    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.dataset.tab);
      });
    });

    document.getElementById('add-patient-btn').addEventListener('click', function () {
      showPatientForm(null);
    });

    document.getElementById('cancel-patient-btn').addEventListener('click', hidePatientModal);
    document.getElementById('close-patient-overlay').addEventListener('click', hidePatientModal);
    document.getElementById('patient-form-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hidePatientModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('patient-form-overlay').hidden) {
        hidePatientModal();
      }
    });

    document.getElementById('prev-page').addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage -= 1;
        renderPatientTable();
      }
    });

    document.getElementById('next-page').addEventListener('click', function () {
      const totalPages = Math.max(1, Math.ceil(allPatients.length / PAGE_SIZE));
      if (currentPage < totalPages) {
        currentPage += 1;
        renderPatientTable();
      }
    });

    document.querySelector('#patient-table').addEventListener('click', async function (e) {
      const editBtn = e.target.closest('.edit-patient');
      const deleteBtn = e.target.closest('.delete-patient');

      if (editBtn) {
        switchTab('patients');
        const patient = await Patients.get(editBtn.dataset.id);
        showPatientForm(patient);
      }

      if (deleteBtn) {
        if (!confirm('Delete this patient and all their history?')) return;
        try {
          await Patients.remove(deleteBtn.dataset.id);
          await loadPatients(true);
          App.showAlert('admin-alert', 'Patient deleted.', 'success');
        } catch (err) {
          App.handleError('admin-alert', err);
        }
      }
    });

    try {
      await Promise.all([loadClinicForm(), loadPatients(), loadStorageWarning()]);
    } catch (err) {
      App.handleError('admin-alert', err);
    }
  });
})();
