(function () {
  'use strict';

  let currentPatientId = null;

  function renderPatientList(patients) {
    const list = document.getElementById('patient-list');
    list.innerHTML = patients.map(function (p) {
      return '<li><button type="button" class="button patient-select" data-id="' + p.id + '" data-testid="select-patient">' +
        App.escapeHtml(p.last_name + ', ' + p.first_name) + '</button></li>';
    }).join('');
  }

  async function loadPatients() {
    const patients = await Patients.list();
    renderPatientList(patients);
  }

  function renderPatientDetails(patient) {
    document.getElementById('patient-details').hidden = false;
    document.getElementById('detail-name').textContent = patient.first_name + ' ' + patient.last_name;
    document.getElementById('detail-dob').textContent = App.formatDate(patient.date_of_birth);
    document.getElementById('detail-phone').textContent = patient.phone || '—';
    document.getElementById('detail-email').textContent = patient.email || '—';
    document.getElementById('detail-address').textContent = patient.address || '—';
    document.getElementById('detail-emergency').textContent =
      (patient.emergency_contact_name || '—') +
      (patient.emergency_contact_phone ? ' (' + patient.emergency_contact_phone + ')' : '');
    document.getElementById('detail-notes').textContent = patient.notes || '—';
    Patients.fillForm(document.getElementById('patient-form'), patient);
  }

  async function loadHistory(patientId) {
    const history = await Patients.listHistory(patientId);
    const list = document.getElementById('history-list');
    if (!history.length) {
      list.innerHTML = '<li>No visit history yet.</li>';
      return;
    }
    list.innerHTML = history.map(function (h) {
      return '<li data-testid="history-entry">' +
        '<strong>' + App.escapeHtml(h.visit_date) + '</strong> — ' +
        App.escapeHtml(h.procedure_type) +
        (h.dentist_name ? ' (' + App.escapeHtml(h.dentist_name) + ')' : '') +
        '<br><span>' + App.escapeHtml(h.description || '') + '</span>' +
        (h.notes ? '<br><em>' + App.escapeHtml(h.notes) + '</em>' : '') +
        '</li>';
    }).join('');
  }

  async function selectPatient(id) {
    currentPatientId = id;
    const patient = await Patients.get(id);
    renderPatientDetails(patient);
    await loadHistory(id);
  }

  async function savePatient(e) {
    e.preventDefault();
    if (!currentPatientId) return;
    App.hideAlert('staff-alert');
    try {
      await Patients.update(currentPatientId, Patients.formToPatient(e.target));
      const patient = await Patients.get(currentPatientId);
      renderPatientDetails(patient);
      await loadPatients();
      App.showAlert('staff-alert', 'Patient details updated.', 'success');
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  async function addHistory(e) {
    e.preventDefault();
    if (!currentPatientId) return;
    App.hideAlert('staff-alert');
    const form = e.target;
    const session = await Auth.getSession();

    try {
      await Patients.addHistory({
        patient_id: currentPatientId,
        visit_date: form.visit_date.value,
        procedure_type: form.procedure_type.value,
        description: form.description.value.trim() || null,
        dentist_name: form.dentist_name.value.trim() || null,
        notes: form.history_notes.value.trim() || null,
        created_by: session.user.id
      });
      form.reset();
      form.visit_date.value = new Date().toISOString().slice(0, 10);
      await loadHistory(currentPatientId);
      App.showAlert('staff-alert', 'Visit history added.', 'success');
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const profile = await Auth.requireRole(['admin', 'staff'], '../login.html');
    if (!profile) return;

    document.getElementById('user-greeting').textContent =
      'Hello, ' + (profile.display_name || 'Staff');
    document.getElementById('user-role').textContent = profile.role;
    document.getElementById('user-role').className =
      'badge badge-' + (profile.role === 'admin' ? 'admin' : 'staff');

    if (profile.role === 'admin') {
      document.getElementById('admin-link').hidden = false;
    }

    document.getElementById('logout-btn').addEventListener('click', async function () {
      await Auth.signOut();
      window.location.href = '../login.html';
    });

    document.getElementById('patient-form').addEventListener('submit', savePatient);
    document.getElementById('history-form').addEventListener('submit', addHistory);

    document.getElementById('patient-list').addEventListener('click', function (e) {
      const btn = e.target.closest('.patient-select');
      if (btn) selectPatient(btn.dataset.id);
    });

    document.getElementById('history-form').visit_date.value =
      new Date().toISOString().slice(0, 10);

    try {
      await loadPatients();
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  });
})();
