(function () {
  'use strict';

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

  function renderPatientTable(patients) {
    const tbody = document.querySelector('#patient-table tbody');
    tbody.innerHTML = patients.map(function (p) {
      return '<tr data-testid="patient-row" data-patient-id="' + p.id + '">' +
        '<td>' + App.escapeHtml(p.last_name + ', ' + p.first_name) + '</td>' +
        '<td>' + App.escapeHtml(p.phone || '—') + '</td>' +
        '<td>' + App.escapeHtml(p.email || '—') + '</td>' +
        '<td><button type="button" class="button small edit-patient" data-id="' + p.id + '" data-testid="edit-patient">Edit</button> ' +
        '<button type="button" class="button small delete-patient" data-id="' + p.id + '" data-testid="delete-patient">Delete</button></td>' +
        '</tr>';
    }).join('');
  }

  async function loadPatients() {
    const patients = await Patients.list();
    renderPatientTable(patients);
  }

  function showPatientForm(patient) {
    document.getElementById('patient-form-panel').hidden = false;
    const form = document.getElementById('patient-form');
    form.reset();
    currentPatientId = patient ? patient.id : null;
    document.getElementById('patient-form-title').textContent =
      patient ? 'Edit Patient' : 'Add Patient';
    if (patient) Patients.fillForm(form, patient);
  }

  async function savePatientForm(e) {
    e.preventDefault();
    App.hideAlert('admin-alert');
    const payload = Patients.formToPatient(e.target);

    try {
      if (currentPatientId) {
        await Patients.update(currentPatientId, payload);
      } else {
        await Patients.create(payload);
      }
      document.getElementById('patient-form-panel').hidden = true;
      currentPatientId = null;
      await loadPatients();
      App.showAlert('admin-alert', 'Patient saved.', 'success');
    } catch (err) {
      App.handleError('admin-alert', err);
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const profile = await Auth.requireRole(['admin'], '../login.html');
    if (!profile) return;

    document.getElementById('user-greeting').textContent =
      'Hello, ' + (profile.display_name || 'Admin');
    document.getElementById('user-role').textContent = profile.role;
    document.getElementById('user-role').className = 'badge badge-admin';

    document.getElementById('logout-btn').addEventListener('click', async function () {
      await Auth.signOut();
      window.location.href = '../login.html';
    });

    document.getElementById('clinic-form').addEventListener('submit', saveClinicForm);
    document.getElementById('patient-form').addEventListener('submit', savePatientForm);

    document.getElementById('add-patient-btn').addEventListener('click', function () {
      showPatientForm(null);
    });

    document.getElementById('cancel-patient-btn').addEventListener('click', function () {
      document.getElementById('patient-form-panel').hidden = true;
      currentPatientId = null;
    });

    document.querySelector('#patient-table').addEventListener('click', async function (e) {
      const editBtn = e.target.closest('.edit-patient');
      const deleteBtn = e.target.closest('.delete-patient');

      if (editBtn) {
        const patient = await Patients.get(editBtn.dataset.id);
        showPatientForm(patient);
      }

      if (deleteBtn) {
        if (!confirm('Delete this patient and all their history?')) return;
        try {
          await Patients.remove(deleteBtn.dataset.id);
          await loadPatients();
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
