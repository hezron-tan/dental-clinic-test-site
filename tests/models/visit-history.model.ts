/** Fields for adding a visit history record on the staff dashboard. */
export interface VisitHistoryFormData {
  visitDate: string;
  procedure: string;
  description?: string;
  dentist?: string;
}
