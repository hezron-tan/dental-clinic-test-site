(function () {
  'use strict';

  const App = {
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

    formatDate(dateStr) {
      if (!dateStr) return '—';
      return new Date(dateStr + 'T00:00:00').toLocaleDateString();
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
