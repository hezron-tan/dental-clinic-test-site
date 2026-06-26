(function () {
  'use strict';

  const PAGE_SIZE = 10;

  let allPatients = [];
  let filteredPatients = [];
  let currentPage = 1;
  let currentPatientId = null;

  function getSearchFilters() {
    const dobRaw = document.getElementById('search-dob').value.trim();
    let dob = '';
    if (dobRaw) {
      const parsed = App.parseDateDMY(dobRaw);
      dob = parsed === null ? '__invalid__' : parsed;
    }

    return {
      name: document.getElementById('search-name').value.trim().toLowerCase(),
      dob: dob
    };
  }

  function matchesSearch(patient, filters) {
    if (filters.name) {
      const haystack = [
        patient.first_name,
        patient.last_name,
        patient.first_name + ' ' + patient.last_name,
        patient.last_name + ' ' + patient.first_name
      ].join(' ').toLowerCase();

      if (!haystack.includes(filters.name)) {
        return false;
      }
    }

    if (filters.dob) {
      if (filters.dob === '__invalid__' || patient.date_of_birth !== filters.dob) {
        return false;
      }
    }

    return true;
  }

  function applyFilters(preservePage) {
    const filters = getSearchFilters();
    filteredPatients = allPatients.filter(function (patient) {
      return matchesSearch(patient, filters);
    });
    if (!preservePage) {
      currentPage = 1;
    }
  }

  function renderPatientTable() {
    const tbody = document.querySelector('#patient-table tbody');
    const total = filteredPatients.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pagePatients = filteredPatients.slice(start, start + PAGE_SIZE);

    if (!pagePatients.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">No patients found.</td></tr>';
    } else {
      tbody.innerHTML = pagePatients.map(function (p) {
        return '<tr data-testid="patient-row" data-patient-id="' + p.id + '">' +
          '<td>' + App.escapeHtml(p.last_name + ', ' + p.first_name) + '</td>' +
          '<td>' + App.escapeHtml(App.formatDateDMY(p.date_of_birth)) + '</td>' +
          '<td>' + App.escapeHtml(p.phone || '—') + '</td>' +
          '<td>' + App.escapeHtml(p.email || '—') + '</td>' +
          '<td><button type="button" class="button edit-patient" data-id="' + p.id + '" data-testid="edit-patient">Edit</button></td>' +
          '</tr>';
      }).join('');
    }

    renderPagination(total, totalPages, start, pagePatients.length);
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

  async function loadPatients(preservePage) {
    allPatients = await Patients.list();
    applyFilters(!!preservePage);
    renderPatientTable();
  }

  function hideAddPatientModal() {
    const overlay = document.getElementById('add-patient-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function showAddPatientForm() {
    document.getElementById('patient-details').hidden = true;
    currentPatientId = null;

    const overlay = document.getElementById('add-patient-overlay');
    document.getElementById('add-patient-form').reset();
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const firstField = document.getElementById('add-patient-first-name');
    if (firstField) firstField.focus();
  }

  function hidePatientPanels() {
    hideAddPatientModal();
    document.getElementById('patient-details').hidden = true;
    currentPatientId = null;
  }

  function renderPatientDetails(patient) {
    hideAddPatientModal();
    document.getElementById('patient-details').hidden = false;
    document.getElementById('detail-name').textContent = patient.first_name + ' ' + patient.last_name;
    document.getElementById('detail-dob').textContent = App.formatDateDMY(patient.date_of_birth);
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
    document.getElementById('patient-details').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveNewPatient(e) {
    e.preventDefault();
    App.hideAlert('staff-alert');

    try {
      const patient = await Patients.create(Patients.formToPatient(e.target));
      e.target.reset();
      hideAddPatientModal();
      await loadPatients();
      await selectPatient(patient.id);
      App.showAlert('staff-alert', 'Patient added.', 'success');
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  async function savePatient(e) {
    e.preventDefault();
    if (!currentPatientId) return;
    App.hideAlert('staff-alert');

    try {
      await Patients.update(currentPatientId, Patients.formToPatient(e.target));
      const patient = await Patients.get(currentPatientId);
      renderPatientDetails(patient);
      await loadPatients(true);
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

  function handleSearch(e) {
    e.preventDefault();
    App.hideAlert('staff-alert');

    const dobRaw = document.getElementById('search-dob').value.trim();
    if (dobRaw && App.parseDateDMY(dobRaw) === null) {
      App.showAlert('staff-alert', 'Enter date of birth as dd/mm/yyyy.', 'error');
      return;
    }

    applyFilters();
    renderPatientTable();
  }

  function clearSearch() {
    document.getElementById('search-name').value = '';
    document.getElementById('search-dob').value = '';
    applyFilters();
    renderPatientTable();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const profile = await Auth.requireRole(['admin', 'staff']);
    if (!profile) return;

    document.getElementById('user-greeting').textContent =
      'Hello, ' + (profile.display_name || 'Staff');
    document.getElementById('user-role').textContent = profile.role;
    document.getElementById('user-role').className =
      'badge badge-' + (profile.role === 'admin' ? 'admin' : 'staff');

    document.getElementById('logout-btn').addEventListener('click', async function () {
      await Auth.signOut();
      window.location.href = App.siteUrl('login.html');
    });

    document.getElementById('add-patient-btn').addEventListener('click', showAddPatientForm);
    document.getElementById('cancel-add-patient-btn').addEventListener('click', hideAddPatientModal);
    document.getElementById('close-add-patient-overlay').addEventListener('click', hideAddPatientModal);
    document.getElementById('add-patient-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideAddPatientModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('add-patient-overlay').hidden) {
        hideAddPatientModal();
      }
    });
    document.getElementById('close-patient-details-btn').addEventListener('click', hidePatientPanels);
    document.getElementById('patient-search-form').addEventListener('submit', handleSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearch);

    document.getElementById('add-patient-form').addEventListener('submit', saveNewPatient);
    document.getElementById('patient-form').addEventListener('submit', savePatient);
    document.getElementById('history-form').addEventListener('submit', addHistory);

    document.querySelector('#patient-table').addEventListener('click', function (e) {
      const editBtn = e.target.closest('.edit-patient');
      if (editBtn) selectPatient(editBtn.dataset.id);
    });

    document.getElementById('prev-page').addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage -= 1;
        renderPatientTable();
      }
    });

    document.getElementById('next-page').addEventListener('click', function () {
      const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
      if (currentPage < totalPages) {
        currentPage += 1;
        renderPatientTable();
      }
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
