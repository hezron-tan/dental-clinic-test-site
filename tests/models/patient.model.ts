/** Shared patient form fields used on admin and staff dashboards. */
export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/** Criteria for the staff patient search form. */
export interface PatientSearchCriteria {
  name?: string;
  dateOfBirth?: string;
}
