import type { Locator, Page } from '@playwright/test';

/** Doctor list table on the admin Doctors tab. */
export class DoctorTableComponent {
  /**
   * @param page - Playwright page that contains the doctor table.
   */
  constructor(private readonly page: Page) {}

  /** Doctor table element. */
  get table(): Locator {
    return this.page.getByTestId('doctor-table');
  }

  /** All doctor data rows. */
  get rows(): Locator {
    return this.page.getByTestId('doctor-row');
  }

  /**
   * Rows whose text includes `name` (exact display name is typical).
   * @param name - Substring to match in the row.
   */
  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  /**
   * Profile picture `<img>` inside the first row matching `name`.
   * @param name - Doctor display name substring.
   */
  avatarImageForDoctor(name: string): Locator {
    return this.rowByName(name).first().locator('img.doctor-avatar');
  }

  /**
   * Clicks Edit on the first row matching `name`.
   * @param name - Doctor display name substring.
   */
  async clickEditForDoctor(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('edit-doctor').click();
  }

  /**
   * Clicks Delete on the first row matching `name` (does not handle the confirm dialog).
   * @param name - Doctor display name substring.
   */
  async clickDeleteForDoctor(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('delete-doctor').click();
  }
}
