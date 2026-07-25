(function () {
  'use strict';

  const PAGE_SIZE = 10;

  let allPatients = [];
  let filteredPatients = [];
  let currentPage = 1;
  let currentPatientId = null;

  let allDoctors = [];
  let currentDoctorId = null;
  let currentDoctorPictureUrl = null;

  function getSearchFilters() {
    return {
      name: document.getElementById('search-name').value.trim().toLowerCase()
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
      tbody.innerHTML = '<tr><td colspan="4">No patients found.</td></tr>';
    } else {
      tbody.innerHTML = pagePatients.map(function (p) {
        return '<tr data-testid="patient-row" data-patient-id="' + p.id + '">' +
          '<td class="col-name">' + App.escapeHtml(p.last_name + ', ' + p.first_name) + '</td>' +
          '<td class="col-phone">' + App.escapeHtml(p.phone || '—') + '</td>' +
          '<td class="col-email">' + App.escapeHtml(p.email || '—') + '</td>' +
          '<td class="col-actions"><div class="table-actions">' +
          '<button type="button" class="icon-action edit-patient" data-id="' + p.id + '" data-testid="edit-patient" data-tooltip="Edit" aria-label="Edit">' +
          '<i class="fas fa-pen" aria-hidden="true"></i></button>' +
          '<button type="button" class="icon-action icon-action-danger delete-patient" data-id="' + p.id + '" data-testid="delete-patient" data-tooltip="Delete" aria-label="Delete">' +
          '<i class="fas fa-trash" aria-hidden="true"></i></button>' +
          '</div></td>' +
          '</tr>';
      }).join('');
    }

    renderPagination(total, totalPages, start, pagePatients.length);
  }

  async function loadPatients(preservePage) {
    allPatients = await Patients.list();
    applyFilters(preservePage);
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

  /**
   * Builds initials for a doctor avatar (skips a leading "Dr." title).
   * @param {string|null|undefined} name - Doctor display name.
   * @returns {string} One or two uppercase initials.
   */
  function doctorInitials(name) {
    const cleaned = String(name || '').replace(/^dr\.?\s+/i, '').trim();
    if (!cleaned) return '?';
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return cleaned.charAt(0).toUpperCase();
  }

  /**
   * Renders a doctor avatar cell (image or initials placeholder).
   * @param {object} doctor - Doctor row.
   * @returns {string} HTML for the photo cell.
   */
  function doctorAvatarHtml(doctor) {
    if (doctor.profile_picture_url) {
      return '<img class="doctor-avatar" src="' + App.escapeHtml(doctor.profile_picture_url) +
        '" alt="" width="40" height="40" />';
    }
    return '<span class="doctor-avatar doctor-avatar--placeholder" aria-hidden="true">' +
      App.escapeHtml(doctorInitials(doctor.name)) + '</span>';
  }

  /**
   * Truncates description text for the doctors table.
   * @param {string|null|undefined} text - Full description.
   * @param {number} max - Max characters before ellipsis.
   * @returns {string}
   */
  function truncateText(text, max) {
    if (!text) return '—';
    const trimmed = text.trim();
    if (trimmed.length <= max) return trimmed;
    return trimmed.slice(0, max - 1) + '…';
  }

  function renderDoctorTable() {
    const tbody = document.querySelector('#doctor-table tbody');
    if (!allDoctors.length) {
      tbody.innerHTML = '<tr><td colspan="4">No doctors found.</td></tr>';
      return;
    }

    tbody.innerHTML = allDoctors.map(function (d) {
      return '<tr data-testid="doctor-row" data-doctor-id="' + d.id + '">' +
        '<td class="col-photo">' + doctorAvatarHtml(d) + '</td>' +
        '<td class="col-name">' + App.escapeHtml(d.name) + '</td>' +
        '<td class="col-description">' + App.escapeHtml(truncateText(d.description, 80)) + '</td>' +
        '<td class="col-actions"><div class="table-actions">' +
        '<button type="button" class="icon-action edit-doctor" data-id="' + d.id + '" data-testid="edit-doctor" data-tooltip="Edit" aria-label="Edit">' +
        '<i class="fas fa-pen" aria-hidden="true"></i></button>' +
        '<button type="button" class="icon-action icon-action-danger delete-doctor" data-id="' + d.id + '" data-testid="delete-doctor" data-tooltip="Delete" aria-label="Delete">' +
        '<i class="fas fa-trash" aria-hidden="true"></i></button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  async function loadDoctors() {
    allDoctors = await Doctors.list();
    renderDoctorTable();
  }

  function setDoctorPhotoPreview(url) {
    const wrap = document.getElementById('doctor-photo-preview');
    const img = document.getElementById('doctor-photo-preview-img');
    if (!wrap || !img) return;
    if (url) {
      img.src = url;
      wrap.hidden = false;
    } else {
      img.removeAttribute('src');
      wrap.hidden = true;
    }
  }

  function hideDoctorModal() {
    const overlay = document.getElementById('doctor-form-overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    currentDoctorId = null;
    currentDoctorPictureUrl = null;
    setDoctorPhotoPreview(null);
    const fileInput = document.getElementById('doctor-photo');
    if (fileInput) fileInput.value = '';
  }

  /**
   * Opens the add/edit doctor modal.
   * @param {object|null} doctor - Existing doctor, or null for create.
   */
  function showDoctorForm(doctor) {
    const overlay = document.getElementById('doctor-form-overlay');
    const form = document.getElementById('doctor-form');
    form.reset();
    currentDoctorId = doctor ? doctor.id : null;
    currentDoctorPictureUrl = doctor ? doctor.profile_picture_url : null;
    document.getElementById('doctor-form-title').textContent =
      doctor ? 'Edit Doctor' : 'Add Doctor';
    if (doctor) Doctors.fillForm(form, doctor);
    setDoctorPhotoPreview(currentDoctorPictureUrl);

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const firstField = form.querySelector('[name="name"]');
    if (firstField) firstField.focus();
  }

  const TAB_TITLES = {
    clinic: 'Clinic Information',
    patients: 'Patients',
    doctors: 'Doctors'
  };

  /**
   * Switches the active admin section (sidebar nav + content panel).
   * @param {string} tabId - Section id (`clinic` | `patients` | `doctors`).
   */
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

    const titleEl = document.getElementById('page-section-title');
    if (titleEl && TAB_TITLES[tabId]) {
      titleEl.textContent = TAB_TITLES[tabId];
    }

    closeMobileDrawer();
  }

  /** Opens the temporary drawer on small screens. */
  function openMobileDrawer() {
    const drawer = document.querySelector('.dashboard-drawer');
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
    const drawer = document.querySelector('.dashboard-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const toggle = document.getElementById('drawer-toggle');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    if (backdrop) backdrop.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
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

  /**
   * Saves a doctor (create or update) and optionally uploads a new profile picture.
   * @param {SubmitEvent} e - Form submit event.
   */
  async function saveDoctorForm(e) {
    e.preventDefault();
    App.hideAlert('admin-alert');
    const form = e.target;
    const payload = Doctors.formToDoctor(form);
    const fileInput = form.querySelector('[name="profile_picture"]');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    try {
      let doctor;
      if (currentDoctorId) {
        doctor = await Doctors.update(currentDoctorId, payload);
      } else {
        doctor = await Doctors.create(payload);
      }

      if (file) {
        const publicUrl = await Doctors.uploadProfilePicture(
          doctor.id,
          file,
          currentDoctorPictureUrl
        );
        doctor = await Doctors.update(doctor.id, { profile_picture_url: publicUrl });
      }

      form.reset();
      hideDoctorModal();
      await loadDoctors();
      App.showAlert('admin-alert', 'Doctor saved.', 'success');
    } catch (err) {
      App.handleError('admin-alert', err);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    App.hideAlert('admin-alert');
    applyFilters();
    renderPatientTable();
  }

  function clearSearch() {
    document.getElementById('search-name').value = '';
    applyFilters();
    renderPatientTable();
  }

  /**
   * Returns true when either patient or doctor modal is open.
   * @returns {boolean}
   */
  function isAnyModalOpen() {
    const patientOverlay = document.getElementById('patient-form-overlay');
    const doctorOverlay = document.getElementById('doctor-form-overlay');
    return (patientOverlay && !patientOverlay.hidden) ||
      (doctorOverlay && !doctorOverlay.hidden);
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const profile = await Auth.requireRole(['admin']);
    if (!profile) return;

    document.getElementById('user-greeting').textContent =
      'Hello, ' + (profile.display_name || 'Admin');
    document.getElementById('user-role').textContent = profile.role;
    document.getElementById('user-role').className = 'badge badge-admin';

    document.getElementById('logout-btn').addEventListener('click', async function (e) {
      e.preventDefault();
      await Auth.signOut();
      window.location.href = App.siteUrl('login.html');
    });

    const drawerToggle = document.getElementById('drawer-toggle');
    if (drawerToggle) {
      drawerToggle.addEventListener('click', function () {
        const drawer = document.querySelector('.dashboard-drawer');
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

    document.getElementById('clinic-form').addEventListener('submit', saveClinicForm);
    document.getElementById('patient-form').addEventListener('submit', savePatientForm);
    document.getElementById('doctor-form').addEventListener('submit', saveDoctorForm);

    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.dataset.tab);
      });
    });

    document.getElementById('add-patient-btn').addEventListener('click', function () {
      showPatientForm(null);
    });

    document.getElementById('add-doctor-btn').addEventListener('click', function () {
      showDoctorForm(null);
    });

    document.getElementById('patient-search-form').addEventListener('submit', handleSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearch);

    document.getElementById('cancel-patient-btn').addEventListener('click', hidePatientModal);
    document.getElementById('close-patient-overlay').addEventListener('click', hidePatientModal);
    document.getElementById('patient-form-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hidePatientModal();
    });

    document.getElementById('cancel-doctor-btn').addEventListener('click', hideDoctorModal);
    document.getElementById('close-doctor-overlay').addEventListener('click', hideDoctorModal);
    document.getElementById('doctor-form-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideDoctorModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !isAnyModalOpen()) return;
      if (!document.getElementById('doctor-form-overlay').hidden) {
        hideDoctorModal();
      } else {
        hidePatientModal();
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

    document.querySelector('#doctor-table').addEventListener('click', async function (e) {
      const editBtn = e.target.closest('.edit-doctor');
      const deleteBtn = e.target.closest('.delete-doctor');

      if (editBtn) {
        switchTab('doctors');
        try {
          const doctor = await Doctors.get(editBtn.dataset.id);
          showDoctorForm(doctor);
        } catch (err) {
          App.handleError('admin-alert', err);
        }
      }

      if (deleteBtn) {
        if (!confirm('Delete this doctor?')) return;
        try {
          await Doctors.remove(deleteBtn.dataset.id);
          await loadDoctors();
          App.showAlert('admin-alert', 'Doctor deleted.', 'success');
        } catch (err) {
          App.handleError('admin-alert', err);
        }
      }
    });

    try {
      await Promise.all([loadClinicForm(), loadPatients(), loadDoctors(), loadStorageWarning()]);
    } catch (err) {
      App.handleError('admin-alert', err);
    }
  });
})();
