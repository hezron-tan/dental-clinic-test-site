(function () {
  'use strict';

  const Patients = {
    async list() {
      const { data, error } = await window.supabaseClient
        .from('patients')
        .select('*')
        .order('last_name');
      if (error) throw error;
      return data;
    },

    async get(id) {
      const { data, error } = await window.supabaseClient
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(patient) {
      const { data, error } = await window.supabaseClient
        .from('patients')
        .insert(patient)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, patient) {
      const { data, error } = await window.supabaseClient
        .from('patients')
        .update(patient)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async remove(id) {
      const { error } = await window.supabaseClient
        .from('patients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async listHistory(patientId) {
      const { data, error } = await window.supabaseClient
        .from('patient_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      return data;
    },

    async addHistory(entry) {
      const { data, error } = await window.supabaseClient
        .from('patient_history')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async removeHistory(id) {
      const { error } = await window.supabaseClient
        .from('patient_history')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    formToPatient(form) {
      return {
        first_name: form.first_name.value.trim(),
        last_name: form.last_name.value.trim(),
        date_of_birth: form.date_of_birth.value || null,
        email: form.email.value.trim() || null,
        phone: form.phone.value.trim() || null,
        address: form.address.value.trim() || null,
        emergency_contact_name: form.emergency_contact_name.value.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.value.trim() || null,
        notes: form.notes.value.trim() || null
      };
    },

    fillForm(form, patient) {
      form.first_name.value = patient.first_name || '';
      form.last_name.value = patient.last_name || '';
      form.date_of_birth.value = patient.date_of_birth || '';
      form.email.value = patient.email || '';
      form.phone.value = patient.phone || '';
      form.address.value = patient.address || '';
      form.emergency_contact_name.value = patient.emergency_contact_name || '';
      form.emergency_contact_phone.value = patient.emergency_contact_phone || '';
      form.notes.value = patient.notes || '';
    }
  };

  window.Patients = Patients;
})();
