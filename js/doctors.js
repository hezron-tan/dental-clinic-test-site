(function () {
  'use strict';

  var BUCKET = 'doctor-avatars';
  var MAX_BYTES = 2 * 1024 * 1024;
  var ALLOWED_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  /**
   * Extracts the Storage object path from a public profile picture URL.
   * @param {string|null|undefined} url - Public URL stored on the doctor row.
   * @returns {string|null} Object path within the bucket, or null.
   */
  function pathFromPublicUrl(url) {
    if (!url) return null;
    var marker = '/object/public/' + BUCKET + '/';
    var idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
  }

  /**
   * Builds a storage object path for a doctor's avatar file.
   * @param {string} doctorId - Doctor UUID.
   * @param {File} file - Uploaded image file.
   * @returns {string} Path like `{doctorId}/{timestamp}.jpg`.
   */
  function buildObjectPath(doctorId, file) {
    var ext = ALLOWED_TYPES[file.type] || 'jpg';
    return doctorId + '/' + Date.now() + '.' + ext;
  }

  var Doctors = {
    /**
     * Lists all doctors ordered by name.
     * @returns {Promise<object[]>}
     */
    async list() {
      var result = await window.supabaseClient
        .from('doctors')
        .select('*')
        .order('name');
      if (result.error) throw result.error;
      return result.data;
    },

    /**
     * Fetches a single doctor by id.
     * @param {string} id - Doctor UUID.
     * @returns {Promise<object>}
     */
    async get(id) {
      var result = await window.supabaseClient
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    /**
     * Creates a doctor row.
     * @param {object} doctor - Fields to insert (`name`, `description`, optional `profile_picture_url`).
     * @returns {Promise<object>}
     */
    async create(doctor) {
      var result = await window.supabaseClient
        .from('doctors')
        .insert(doctor)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    /**
     * Updates a doctor row.
     * @param {string} id - Doctor UUID.
     * @param {object} doctor - Fields to update.
     * @returns {Promise<object>}
     */
    async update(id, doctor) {
      var result = await window.supabaseClient
        .from('doctors')
        .update(doctor)
        .eq('id', id)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },

    /**
     * Deletes a doctor and any associated avatar file in Storage.
     * @param {string} id - Doctor UUID.
     * @returns {Promise<void>}
     */
    async remove(id) {
      var doctor = await Doctors.get(id);
      var path = pathFromPublicUrl(doctor.profile_picture_url);
      if (path) {
        await window.supabaseClient.storage.from(BUCKET).remove([path]);
      }
      var result = await window.supabaseClient
        .from('doctors')
        .delete()
        .eq('id', id);
      if (result.error) throw result.error;
    },

    /**
     * Validates and uploads a profile picture, returning its public URL.
     * Replaces any previous avatar for the same doctor.
     * @param {string} doctorId - Doctor UUID (folder prefix).
     * @param {File} file - Image file from an `<input type="file">`.
     * @param {string|null} [previousUrl] - Existing public URL to remove after upload.
     * @returns {Promise<string>} Public URL of the uploaded image.
     */
    async uploadProfilePicture(doctorId, file, previousUrl) {
      if (!file) {
        throw new Error('No file selected.');
      }
      if (!ALLOWED_TYPES[file.type]) {
        throw new Error('Profile picture must be a JPEG, PNG, WebP, or GIF image.');
      }
      if (file.size > MAX_BYTES) {
        throw new Error('Profile picture must be 2 MB or smaller.');
      }

      var path = buildObjectPath(doctorId, file);
      var upload = await window.supabaseClient.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upload.error) throw upload.error;

      var publicUrl = window.supabaseClient.storage
        .from(BUCKET)
        .getPublicUrl(path).data.publicUrl;

      var oldPath = pathFromPublicUrl(previousUrl);
      if (oldPath && oldPath !== path) {
        await window.supabaseClient.storage.from(BUCKET).remove([oldPath]);
      }

      return publicUrl;
    },

    /**
     * Maps doctor form fields to a DB payload (excludes the file input).
     * @param {HTMLFormElement} form - Doctor form element.
     * @returns {{ name: string, description: string|null }}
     */
    formToDoctor(form) {
      var nameInput = form.querySelector('[name="name"]');
      var descriptionInput = form.querySelector('[name="description"]');
      return {
        name: (nameInput ? nameInput.value : '').trim(),
        description: (descriptionInput ? descriptionInput.value : '').trim() || null
      };
    },

    /**
     * Populates a doctor form from a row (does not set the file input).
     * @param {HTMLFormElement} form - Doctor form element.
     * @param {object} doctor - Doctor row.
     */
    fillForm(form, doctor) {
      var nameInput = form.querySelector('[name="name"]');
      var descriptionInput = form.querySelector('[name="description"]');
      if (nameInput) nameInput.value = doctor.name || '';
      if (descriptionInput) descriptionInput.value = doctor.description || '';
    }
  };

  window.Doctors = Doctors;
})();
