(function () {
  'use strict';

  const PAGE_SIZE = 10;

  let allPatients = [];
  let filteredPatients = [];
  let currentPage = 1;
  let currentPatientId = null;
  let isEditingPatient = false;

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
          '<td><div class="table-actions">' +
          '<button type="button" class="button view-patient" data-id="' + p.id + '" data-testid="view-patient">View</button>' +
          '<button type="button" class="button add-visit-patient" data-id="' + p.id + '" data-testid="add-visit-patient">Add Visit</button>' +
          '</div></td>' +
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

  function setModalOpen(isOpen) {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }

  function isAnyOverlayOpen() {
    return !document.getElementById('add-patient-overlay').hidden ||
      !document.getElementById('view-patient-overlay').hidden ||
      !document.getElementById('add-visit-overlay').hidden;
  }

  function hideAddPatientModal() {
    const overlay = document.getElementById('add-patient-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    if (!isAnyOverlayOpen()) {
      setModalOpen(false);
    }
  }

  function showAddPatientForm() {
    hideViewPatientOverlay();
    hideAddVisitOverlay();
    currentPatientId = null;

    const overlay = document.getElementById('add-patient-overlay');
    document.getElementById('add-patient-form').reset();
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setModalOpen(true);

    const firstField = document.getElementById('add-patient-first-name');
    if (firstField) firstField.focus();
  }

  function setPatientEditMode(editing) {
    isEditingPatient = editing;
    document.getElementById('patient-readonly-view').hidden = editing;
    document.getElementById('patient-edit-view').hidden = !editing;
    document.getElementById('edit-patient-btn').hidden = editing;
  }

  function renderPatientReadonly(patient) {
    document.getElementById('view-patient-title').textContent =
      patient.first_name + ' ' + patient.last_name;
    document.getElementById('view-first-name').textContent = patient.first_name || '—';
    document.getElementById('view-last-name').textContent = patient.last_name || '—';
    document.getElementById('view-dob').textContent = App.formatDateDMY(patient.date_of_birth);
    document.getElementById('view-phone').textContent = patient.phone || '—';
    document.getElementById('view-email').textContent = patient.email || '—';
    document.getElementById('view-address').textContent = patient.address || '—';
    document.getElementById('view-emergency-name').textContent =
      patient.emergency_contact_name || '—';
    document.getElementById('view-emergency-phone').textContent =
      patient.emergency_contact_phone || '—';
    document.getElementById('view-notes').textContent = patient.notes || '—';
    Patients.fillForm(document.getElementById('patient-form'), patient);
  }

  function hideViewPatientOverlay() {
    const overlay = document.getElementById('view-patient-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    setPatientEditMode(false);
    currentPatientId = null;
    if (!isAnyOverlayOpen()) {
      setModalOpen(false);
    }
  }

  function showViewPatientOverlay(patient) {
    hideAddPatientModal();
    hideAddVisitOverlay();
    currentPatientId = patient.id;
    renderPatientReadonly(patient);
    setPatientEditMode(false);

    const overlay = document.getElementById('view-patient-overlay');
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setModalOpen(true);
  }

  function hideAddVisitOverlay() {
    const overlay = document.getElementById('add-visit-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    currentPatientId = null;
    if (!isAnyOverlayOpen()) {
      setModalOpen(false);
    }
  }

  async function showAddVisitOverlay(patient) {
    hideAddPatientModal();
    hideViewPatientOverlay();
    currentPatientId = patient.id;

    document.getElementById('add-visit-title').textContent = 'Add Visit Record';
    document.getElementById('add-visit-patient-name').textContent =
      patient.first_name + ' ' + patient.last_name;

    const form = document.getElementById('history-form');
    form.reset();
    form.visit_date.value = new Date().toISOString().slice(0, 10);

    const overlay = document.getElementById('add-visit-overlay');
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setModalOpen(true);

    form.visit_date.focus();
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

  async function openViewPatient(id) {
    try {
      currentPatientId = id;
      const patient = await Patients.get(id);
      showViewPatientOverlay(patient);
      await loadHistory(id);
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  async function openAddVisit(id) {
    try {
      const patient = await Patients.get(id);
      await showAddVisitOverlay(patient);
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  async function saveNewPatient(e) {
    e.preventDefault();
    App.hideAlert('staff-alert');

    try {
      const patient = await Patients.create(Patients.formToPatient(e.target));
      e.target.reset();
      hideAddPatientModal();
      await loadPatients();
      await openViewPatient(patient.id);
      App.showToast('Patient added.', 'success');
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  async function savePatient(e) {
    e.preventDefault();
    if (!currentPatientId) return;

    try {
      await Patients.update(currentPatientId, Patients.formToPatient(e.target));
      hideViewPatientOverlay();
      await loadPatients(true);
      App.showToast('Patient has been updated.', 'success');
    } catch (err) {
      console.error(err);
      App.showToast('Patient data can\'t be updated.', 'error');
    }
  }

  async function addHistory(e) {
    e.preventDefault();
    if (!currentPatientId) return;
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
      hideAddVisitOverlay();
      currentPatientId = null;
      App.showToast('Patient has been updated.', 'success');
    } catch (err) {
      console.error(err);
      App.showToast('Patient\'s visit can\'t be updated.', 'error');
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

  function handleOverlayEscape() {
    if (!document.getElementById('add-patient-overlay').hidden) {
      hideAddPatientModal();
    } else if (!document.getElementById('view-patient-overlay').hidden) {
      hideViewPatientOverlay();
    } else if (!document.getElementById('add-visit-overlay').hidden) {
      hideAddVisitOverlay();
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const profile = await Auth.requireRole(['admin', 'staff']);
    if (!profile) return;

    document.getElementById('user-greeting').textContent =
      'Hello, ' + (profile.display_name || 'Staff');
    document.getElementById('user-role').textContent = profile.role;
    document.getElementById('user-role').className =
      'badge badge-' + (profile.role === 'admin' ? 'admin' : 'staff');

    document.getElementById('logout-btn').addEventListener('click', async function (e) {
      e.preventDefault();
      await Auth.signOut();
      window.location.href = App.siteUrl('login.html');
    });

    document.getElementById('add-patient-btn').addEventListener('click', showAddPatientForm);
    document.getElementById('cancel-add-patient-btn').addEventListener('click', hideAddPatientModal);
    document.getElementById('close-add-patient-overlay').addEventListener('click', hideAddPatientModal);
    document.getElementById('add-patient-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideAddPatientModal();
    });

    document.getElementById('close-view-patient-overlay').addEventListener('click', hideViewPatientOverlay);
    document.getElementById('cancel-view-patient-btn').addEventListener('click', hideViewPatientOverlay);
    document.getElementById('view-patient-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideViewPatientOverlay();
    });
    document.getElementById('edit-patient-btn').addEventListener('click', function () {
      setPatientEditMode(true);
      const firstField = document.querySelector('#patient-form [name="first_name"]');
      if (firstField) firstField.focus();
    });

    document.getElementById('close-add-visit-overlay').addEventListener('click', hideAddVisitOverlay);
    document.getElementById('cancel-add-visit-btn').addEventListener('click', hideAddVisitOverlay);
    document.getElementById('add-visit-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideAddVisitOverlay();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isAnyOverlayOpen()) {
        handleOverlayEscape();
      }
    });

    document.getElementById('patient-search-form').addEventListener('submit', handleSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearch);

    document.getElementById('add-patient-form').addEventListener('submit', saveNewPatient);
    document.getElementById('patient-form').addEventListener('submit', savePatient);
    document.getElementById('history-form').addEventListener('submit', addHistory);

    document.querySelector('#patient-table').addEventListener('click', function (e) {
      const viewBtn = e.target.closest('.view-patient');
      if (viewBtn) {
        openViewPatient(viewBtn.dataset.id);
        return;
      }
      const addVisitBtn = e.target.closest('.add-visit-patient');
      if (addVisitBtn) {
        openAddVisit(addVisitBtn.dataset.id);
      }
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

    try {
      await loadPatients();
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  });
})();
