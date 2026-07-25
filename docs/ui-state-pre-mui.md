# UI state snapshot — pre–Material UI pass

**Date:** 2026-07-25  
**Scope:** Admin, Staff, and Login portal pages (not public homepage)  
**Backup files:** `backups/ui-pre-mui-2026-07-25/`

## Stack at snapshot

- Static HTML + Arcana (HTML5 UP) template (`assets/css/main.css`)
- App overlay styles: `css/app.css` (Bright Smile cyan/navy tokens)
- No React / no `@mui/material` package — vanilla JS dashboards

## Visual language (before)

| Area | Treatment |
|------|-----------|
| Page background | Soft blue-gray gradient (`--bs-page` / cyan washes) |
| Header | Navy gradient App-style bar + cyan accent nav underline |
| Content | White article “card” with cyan border, soft shadow, ~0.75rem radius |
| Buttons | Arcana pill/block buttons; primary = cyan fill |
| Tables | Fixed layout, cyan borders, zebra rows |
| Tabs (admin) | Underline tabs, cyan active indicator |
| Modals | Centered dialog, cyan border, navy title |
| Badges | Uppercase pills for admin/staff role |
| Toasts (staff) | Bottom-right colored bars |

## Files backed up

- `admin/index.html`
- `staff/index.html`
- `login.html`
- `css/app.css`
- `js/admin-dashboard.js`
- `js/staff-dashboard.js`

## Test contracts to preserve

All `data-testid` attributes on admin/staff pages and overlays must remain stable for Playwright (`tests/ui/staff.spec.ts`, `tests/ui/negative.spec.ts`, page objects).

## Restore

Copy from `backups/ui-pre-mui-2026-07-25/` over the live paths, remove `css/mui-portal.css` (and its `<link>` from admin/staff HTML), and drop the Roboto / Font Awesome links added for the Material pass if you want a full revert.

## Applied after this snapshot (Material UI guidelines)

Because this site is static HTML (not React), [Material UI](https://mui.com/material-ui/) was applied as **Material Design patterns** via `css/mui-portal.css` on admin, staff, and login:

- Roboto typography; 8px spacing; 4px shape radius
- AppBar (primary `#0288d1`, elevation 4)
- Paper surfaces (elevation 1)
- Contained / outlined buttons; outlined text fields
- Underline tabs; chip-style role badges
- Dialog elevation 24; IconButton-style row actions
- Snackbar-like toasts (staff)
- Full-width Sign In button and divider hint on login
- All `data-testid` attributes kept for Playwright
