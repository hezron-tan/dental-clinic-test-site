(function () {
  'use strict';

  const PAGE_SIZE = 10;

  let allPatients = [];
  let filteredPatients = [];
  let currentPage = 1;
  let currentPatientId = null;
  let isEditingPatient = false;
  let loadedPatient = null;

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
          '<td class="col-name">' + App.escapeHtml(p.last_name + ', ' + p.first_name) + '</td>' +
          '<td class="col-dob">' + App.escapeHtml(App.formatDateDMY(p.date_of_birth)) + '</td>' +
          '<td class="col-phone">' + App.escapeHtml(p.phone || '—') + '</td>' +
          '<td class="col-email">' + App.escapeHtml(p.email || '—') + '</td>' +
          '<td class="col-actions"><div class="table-actions">' +
          '<button type="button" class="icon-action view-patient" data-id="' + p.id + '" data-testid="view-patient" data-tooltip="View" aria-label="View">' +
          '<i class="fas fa-eye" aria-hidden="true"></i></button>' +
          '<button type="button" class="icon-action add-visit-patient" data-id="' + p.id + '" data-testid="add-visit-patient" data-tooltip="Add Visit" aria-label="Add Visit">' +
          '<i class="fas fa-calendar-plus" aria-hidden="true"></i></button>' +
          '</div></td>' +
          '</tr>';
      }).join('');
    }

    renderPagination(total, totalPages, start, pagePatients.length);
  }

  function renderPagination(total, totalPages, start, shown) {
    const pageInfo = document.getElementById('page-info');
    const firstBtn = document.getElementById('first-page');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const lastBtn = document.getElementById('last-page');

    if (!total) {
      pageInfo.textContent = 'No patients to display';
    } else {
      const from = start + 1;
      const to = start + shown;
      pageInfo.textContent =
        'Showing ' + from + '–' + to + ' of ' + total +
        ' · Page ' + currentPage + ' of ' + totalPages;
    }

    const atStart = currentPage <= 1;
    const atEnd = currentPage >= totalPages;
    if (firstBtn) firstBtn.disabled = atStart;
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
    if (lastBtn) lastBtn.disabled = atEnd;
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
    return !document.getElementById('patient-form-overlay').hidden ||
      !document.getElementById('view-patient-overlay').hidden ||
      !document.getElementById('add-visit-overlay').hidden;
  }

  function hidePatientFormModal() {
    const overlay = document.getElementById('patient-form-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    if (!isAnyOverlayOpen()) {
      setModalOpen(false);
    }
  }

  function showAddPatientForm() {
    hideViewPatientOverlay();
    hideAddVisitOverlay();

    const overlay = document.getElementById('patient-form-overlay');
    const form = document.getElementById('patient-form');
    form.reset();
    document.getElementById('patient-form-title').textContent = 'Add Patient';

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setModalOpen(true);

    const firstField = form.querySelector('[name="first_name"]');
    if (firstField) firstField.focus();
  }

  function setViewFormDisabled(disabled) {
    const form = document.getElementById('view-patient-form');
    form.querySelectorAll('input, textarea, select').forEach(function (field) {
      field.disabled = disabled;
    });
  }

  function setPatientEditMode(editing) {
    isEditingPatient = editing;
    const overlay = document.getElementById('view-patient-overlay');
    const toggleBtn = document.getElementById('edit-patient-btn');
    const saveBtn = document.getElementById('save-patient-btn');
    overlay.classList.toggle('is-editing', editing);
    saveBtn.hidden = !editing;
    document.getElementById('view-patient-title').textContent =
      editing ? 'Edit Patient' : 'Patient Details';
    toggleBtn.textContent = editing ? 'Cancel' : 'Edit';
    setViewFormDisabled(!editing);

    if (editing) {
      const firstField = document.querySelector('#view-patient-form [name="first_name"]');
      if (firstField) firstField.focus();
    }
  }

  function fillViewPatientForm(patient) {
    Patients.fillForm(document.getElementById('view-patient-form'), patient);
  }

  function hideViewPatientOverlay() {
    const overlay = document.getElementById('view-patient-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    setPatientEditMode(false);
    currentPatientId = null;
    loadedPatient = null;
    if (!isAnyOverlayOpen()) {
      setModalOpen(false);
    }
  }

  function showViewPatientOverlay(patient) {
    hidePatientFormModal();
    hideAddVisitOverlay();
    currentPatientId = patient.id;
    loadedPatient = patient;
    fillViewPatientForm(patient);
    setPatientEditMode(false);

    const overlay = document.getElementById('view-patient-overlay');
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setModalOpen(true);
  }

  function hideAddVisitOverlay() {
    const overlay = document.getElementById('add-visit-overlay');
    const form = document.getElementById('history-form');
    if (form) clearHistoryFieldErrors(form);
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    if (!isAnyOverlayOpen()) {
      setModalOpen(false);
    }
  }

  /**
   * Clears all inline field errors on the add-visit form.
   * @param {HTMLFormElement} form - History form element.
   */
  function clearHistoryFieldErrors(form) {
    form.querySelectorAll('.form-field').forEach(function (field) {
      field.classList.remove('has-error');
      const control = field.querySelector('input, select, textarea');
      if (control) {
        control.classList.remove('is-invalid');
        control.removeAttribute('aria-invalid');
      }
      const error = field.querySelector('.field-error');
      if (error) {
        error.hidden = true;
        error.textContent = '';
      }
    });
  }

  /**
   * Shows an inline error under a named history form field.
   * @param {HTMLFormElement} form - History form element.
   * @param {string} fieldName - Form control `name` attribute.
   * @param {string} message - Error message to display.
   */
  function setHistoryFieldError(form, fieldName, message) {
    const field = form.querySelector('.form-field[data-field="' + fieldName + '"]');
    if (!field) return;
    const control = field.querySelector('input, select, textarea');
    const error = field.querySelector('.field-error');
    field.classList.add('has-error');
    if (control) {
      control.classList.add('is-invalid');
      control.setAttribute('aria-invalid', 'true');
    }
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  /**
   * Validates required add-visit fields (everything except notes).
   * @param {HTMLFormElement} form - History form element.
   * @returns {boolean} True when the form is valid.
   */
  function validateHistoryForm(form) {
    clearHistoryFieldErrors(form);
    let valid = true;
    let firstInvalid = null;

    const rules = [
      { name: 'visit_date', message: 'Please enter a visit date.' },
      { name: 'procedure_type', message: 'Please select a procedure type.' },
      { name: 'description', message: 'Please enter a description.' },
      { name: 'dentist_name', message: 'Please select a dentist.' }
    ];

    rules.forEach(function (rule) {
      const control = form.elements.namedItem(rule.name);
      if (!control || typeof control.value !== 'string') return;
      const value = control.value.trim();
      if (!value) {
        setHistoryFieldError(form, rule.name, rule.message);
        valid = false;
        if (!firstInvalid) firstInvalid = control;
      }
    });

    if (firstInvalid && typeof firstInvalid.focus === 'function') {
      firstInvalid.focus();
    }

    return valid;
  }

  /**
   * Clears a single field's error when the user changes its value.
   * @param {Event} e - Input or change event.
   */
  function clearHistoryFieldErrorOnInput(e) {
    const control = e.target;
    if (!control || !control.name) return;
    const field = control.closest('.form-field');
    if (!field || !field.classList.contains('has-error')) return;
    if (String(control.value || '').trim()) {
      field.classList.remove('has-error');
      control.classList.remove('is-invalid');
      control.removeAttribute('aria-invalid');
      const error = field.querySelector('.field-error');
      if (error) {
        error.hidden = true;
        error.textContent = '';
      }
    }
  }

  async function showAddVisitOverlay(patient) {
    hidePatientFormModal();
    hideViewPatientOverlay();
    currentPatientId = patient.id;

    document.getElementById('add-visit-title').textContent = 'Add Visit Record';
    document.getElementById('add-visit-patient-name').textContent =
      patient.first_name + ' ' + patient.last_name;

    const form = document.getElementById('history-form');
    form.reset();
    clearHistoryFieldErrors(form);
    form.visit_date.value = new Date().toISOString().slice(0, 10);
    await populateDentistSelect(form.dentist_name);

    const overlay = document.getElementById('add-visit-overlay');
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setModalOpen(true);

    form.visit_date.focus();
  }

  /**
   * Fills the dentist dropdown from the doctors table.
   * @param {HTMLSelectElement} select - Dentist select element.
   * @returns {Promise<void>}
   */
  async function populateDentistSelect(select) {
    if (!select) return;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a dentist';

    try {
      const doctors = await Doctors.list();
      select.innerHTML = '';
      select.appendChild(placeholder);

      if (!doctors.length) {
        const empty = document.createElement('option');
        empty.value = '';
        empty.disabled = true;
        empty.textContent = 'No doctors available — add them in Admin';
        select.appendChild(empty);
        return;
      }

      doctors.forEach(function (doctor) {
        const option = document.createElement('option');
        option.value = doctor.name;
        option.textContent = doctor.name;
        option.dataset.doctorId = doctor.id;
        select.appendChild(option);
      });
    } catch (err) {
      console.warn('Could not load doctors for dentist dropdown:', err);
      select.innerHTML = '';
      select.appendChild(placeholder);
    }
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

  async function saveAddPatientForm(e) {
    e.preventDefault();
    App.hideAlert('staff-alert');

    try {
      const patient = await Patients.create(Patients.formToPatient(e.target));
      e.target.reset();
      hidePatientFormModal();
      await loadPatients();
      await openViewPatient(patient.id);
      App.showToast('Patient added.', 'success');
    } catch (err) {
      App.handleError('staff-alert', err);
    }
  }

  async function saveViewPatientForm(e) {
    e.preventDefault();
    if (!currentPatientId || !isEditingPatient) return;

    try {
      const payload = Patients.formToPatient(e.target);
      await Patients.update(currentPatientId, payload);
      hideViewPatientOverlay();
      await loadPatients(true);
      App.showToast('Patient has been updated.', 'success');
    } catch (err) {
      console.error(err);
      App.showToast('Patient data can\'t be updated.', 'error');
    }
  }

  function cancelPatientEdit() {
    if (loadedPatient) {
      fillViewPatientForm(loadedPatient);
    }
    setPatientEditMode(false);
  }

  async function addHistory(e) {
    e.preventDefault();
    if (!currentPatientId) return;
    const form = e.target;

    if (!validateHistoryForm(form)) {
      return;
    }

    const session = await Auth.getSession();

    try {
      await Patients.addHistory({
        patient_id: currentPatientId,
        visit_date: form.visit_date.value,
        procedure_type: form.procedure_type.value,
        description: form.description.value.trim(),
        dentist_name: form.dentist_name.value,
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
    if (!document.getElementById('patient-form-overlay').hidden) {
      hidePatientFormModal();
    } else if (!document.getElementById('view-patient-overlay').hidden) {
      if (isEditingPatient) {
        cancelPatientEdit();
      } else {
        hideViewPatientOverlay();
      }
    } else if (!document.getElementById('add-visit-overlay').hidden) {
      hideAddVisitOverlay();
    }
  }

  /**
   * Returns the portal drawer element if present.
   * @returns {HTMLElement|null}
   */
  function getDrawer() {
    return document.querySelector('.dashboard-drawer');
  }

  /** Opens the temporary drawer on small screens. */
  function openMobileDrawer() {
    const drawer = getDrawer();
    const backdrop = document.getElementById('drawer-backdrop');
    const toggle = document.getElementById('drawer-toggle');
    if (!drawer) return;
    drawer.classList.add('is-open');
    if (backdrop) backdrop.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('drawer-open');
  }

  /** Closes the temporary drawer on small screens. */
  function closeMobileDrawer() {
    const drawer = getDrawer();
    const backdrop = document.getElementById('drawer-backdrop');
    const toggle = document.getElementById('drawer-toggle');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    if (backdrop) backdrop.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
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

    const drawerToggle = document.getElementById('drawer-toggle');
    if (drawerToggle) {
      drawerToggle.addEventListener('click', function () {
        const drawer = getDrawer();
        if (drawer && drawer.classList.contains('is-open')) {
          closeMobileDrawer();
        } else {
          openMobileDrawer();
        }
      });
    }

    const drawerBackdrop = document.getElementById('drawer-backdrop');
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeMobileDrawer);
    }

    document.getElementById('add-patient-btn').addEventListener('click', showAddPatientForm);
    document.getElementById('cancel-patient-btn').addEventListener('click', hidePatientFormModal);
    document.getElementById('close-patient-overlay').addEventListener('click', hidePatientFormModal);
    document.getElementById('patient-form-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hidePatientFormModal();
    });

    document.getElementById('close-view-patient-overlay').addEventListener('click', hideViewPatientOverlay);
    document.getElementById('view-patient-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideViewPatientOverlay();
    });
    document.getElementById('edit-patient-btn').addEventListener('click', function () {
      if (isEditingPatient) {
        cancelPatientEdit();
      } else {
        setPatientEditMode(true);
      }
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

    document.getElementById('patient-form').addEventListener('submit', saveAddPatientForm);
    document.getElementById('view-patient-form').addEventListener('submit', saveViewPatientForm);
    document.getElementById('history-form').addEventListener('submit', addHistory);
    document.getElementById('history-form').addEventListener('input', clearHistoryFieldErrorOnInput);
    document.getElementById('history-form').addEventListener('change', clearHistoryFieldErrorOnInput);

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

    document.getElementById('first-page').addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage = 1;
        renderPatientTable();
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

    document.getElementById('last-page').addEventListener('click', function () {
      const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
      if (currentPage < totalPages) {
        currentPage = totalPages;
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
