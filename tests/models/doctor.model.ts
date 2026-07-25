/** Fields for the admin doctor form (add/edit). */
export interface DoctorFormData {
  /** Display name shown in the doctors table and staff dentist dropdown. */
  name: string;
  /** Optional bio / specialty text. */
  description?: string;
  /**
   * Absolute or workspace-relative path to an image file for `setInputFiles`.
   * When set, the admin form uploads it as the profile picture.
   */
  profilePicturePath?: string;
}
