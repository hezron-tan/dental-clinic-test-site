(function () {
  'use strict';

  const App = {
    _siteRoot: null,

    siteRoot() {
      if (this._siteRoot !== null) return this._siteRoot;

      const script = [...document.querySelectorAll('script[src]')].find((el) => {
        const src = el.getAttribute('src') || '';
        return /(?:^|\/)js\/(auth|app|config|supabase-client)\.js(\?|$)/.test(src);
      });

      if (!script) {
        this._siteRoot = '';
        return this._siteRoot;
      }

      const scriptUrl = new URL(script.getAttribute('src'), window.location.href);
      this._siteRoot = scriptUrl.pathname.replace(/\/js\/[^/]+\.js$/, '') || '';
      return this._siteRoot;
    },

    siteUrl(relativePath) {
      const cleaned = String(relativePath).replace(/^\//, '');
      const root = this.siteRoot();
      const pathname = root ? `${root}/${cleaned}` : `/${cleaned}`;
      return `${window.location.origin}${pathname}`;
    },

    showAlert(containerId, message, type) {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.textContent = message;
      el.className = 'alert alert-' + (type || 'info');
      el.hidden = false;
    },

    hideAlert(containerId) {
      const el = document.getElementById(containerId);
      if (el) el.hidden = true;
    },

    showToast(message, type, options) {
      const opts = options || {};
      const duration = opts.duration !== undefined ? opts.duration : 30000;

      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('data-testid', 'toast-container');
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + (type || 'info');
      toast.setAttribute('role', 'alert');
      toast.setAttribute('data-testid', 'toast');

      const messageEl = document.createElement('span');
      messageEl.className = 'toast-message';
      messageEl.textContent = message;

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', function () {
        App.hideToast(toast);
      });

      toast.appendChild(messageEl);
      toast.appendChild(closeBtn);
      container.appendChild(toast);

      if (duration > 0) {
        setTimeout(function () {
          App.hideToast(toast);
        }, duration);
      }

      return toast;
    },

    hideToast(toast) {
      if (!toast || !toast.parentNode) return;
      toast.classList.add('toast-hiding');
      setTimeout(function () {
        toast.remove();
      }, 300);
    },

    formatDate(dateStr) {
      if (!dateStr) return '—';
      return new Date(dateStr + 'T00:00:00').toLocaleDateString();
    },

    formatDateDMY(dateStr) {
      if (!dateStr) return '—';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    },

    parseDateDMY(value) {
      const trimmed = String(value || '').trim();
      if (!trimmed) return '';

      const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) return null;

      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;

      const iso =
        year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const date = new Date(iso + 'T00:00:00');
      if (
        isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day
      ) {
        return null;
      }

      return iso;
    },

    formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text ?? '';
      return div.innerHTML;
    },

    async handleError(containerId, error) {
      console.error(error);
      this.showAlert(containerId, error.message || 'Something went wrong', 'error');
    }
  };

  window.App = App;
})();
