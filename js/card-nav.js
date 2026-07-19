/*
 * Card Nav interactions.
 *
 * Vanilla JS port of the React Bits "Card Nav" component
 * (https://reactbits.dev/components/card-nav). The expandable bar reveals card
 * panels of nested links. Animation is driven by CSS transitions (height on the
 * bar, staggered translate/opacity on the cards) instead of GSAP so no extra
 * dependency is required.
 */
(function () {
  'use strict';

  var TOP_BAR_HEIGHT = 60;
  var DESKTOP_EXPANDED_HEIGHT = 260;
  var MOBILE_BREAKPOINT = '(max-width: 768px)';
  var CONTENT_PADDING = 16;

  /**
   * Computes the target expanded height of the nav bar.
   * On desktop this is a fixed height; on mobile it is measured from the
   * stacked card content (mirrors the React Bits `calculateHeight` logic).
   * @param {HTMLElement} navEl - The `.card-nav` element.
   * @returns {number} The expanded height in pixels.
   */
  function calculateHeight(navEl) {
    var isMobile = window.matchMedia(MOBILE_BREAKPOINT).matches;
    if (!isMobile) {
      return DESKTOP_EXPANDED_HEIGHT;
    }

    var contentEl = navEl.querySelector('.card-nav-content');
    if (!contentEl) {
      return DESKTOP_EXPANDED_HEIGHT;
    }

    var prev = {
      visibility: contentEl.style.visibility,
      pointerEvents: contentEl.style.pointerEvents,
      position: contentEl.style.position,
      height: contentEl.style.height
    };

    contentEl.style.visibility = 'visible';
    contentEl.style.pointerEvents = 'auto';
    contentEl.style.position = 'static';
    contentEl.style.height = 'auto';

    // Force reflow so scrollHeight reflects the temporary layout.
    void contentEl.offsetHeight;
    var contentHeight = contentEl.scrollHeight;

    contentEl.style.visibility = prev.visibility;
    contentEl.style.pointerEvents = prev.pointerEvents;
    contentEl.style.position = prev.position;
    contentEl.style.height = prev.height;

    return TOP_BAR_HEIGHT + contentHeight + CONTENT_PADDING;
  }

  /**
   * Wires up a single Card Nav instance: toggle, keyboard support, resize
   * handling, and auto-close when a link is activated.
   * @param {HTMLElement} container - The `.card-nav-container` root element.
   * @returns {void}
   */
  function initCardNav(container) {
    var navEl = container.querySelector('.card-nav');
    var hamburger = container.querySelector('.hamburger-menu');
    var content = container.querySelector('.card-nav-content');
    if (!navEl || !hamburger || !content) {
      return;
    }

    var isExpanded = false;

    /** Opens the nav: reveals cards and grows the bar to fit them. */
    function openMenu() {
      isExpanded = true;
      navEl.classList.add('open', 'revealed');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close menu');
      content.setAttribute('aria-hidden', 'false');
      navEl.style.height = calculateHeight(navEl) + 'px';
    }

    /** Closes the nav: collapses the bar and hides cards after the transition. */
    function closeMenu() {
      isExpanded = false;
      navEl.classList.remove('revealed');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
      content.setAttribute('aria-hidden', 'true');
      navEl.style.height = TOP_BAR_HEIGHT + 'px';

      var onEnd = function (event) {
        if (event.target === navEl && event.propertyName === 'height') {
          navEl.classList.remove('open');
          navEl.removeEventListener('transitionend', onEnd);
        }
      };
      navEl.addEventListener('transitionend', onEnd);

      // Fallback in case the transitionend event never fires (e.g. reduced motion).
      window.setTimeout(function () {
        if (!isExpanded) {
          navEl.classList.remove('open');
        }
      }, 500);
    }

    /** Toggles the nav open/closed. */
    function toggleMenu() {
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        toggleMenu();
      }
    });

    // Collapse the menu after choosing a link (keeps same-page anchors tidy).
    content.addEventListener('click', function (event) {
      if (event.target.closest('.nav-card-link') && isExpanded) {
        closeMenu();
      }
    });

    // Keep the expanded height accurate across viewport changes.
    window.addEventListener('resize', function () {
      if (isExpanded) {
        navEl.style.height = calculateHeight(navEl) + 'px';
      }
    });
  }

  /**
   * Bootstraps every Card Nav on the page once the DOM is ready.
   * @returns {void}
   */
  function boot() {
    var containers = document.querySelectorAll('.card-nav-container');
    for (var i = 0; i < containers.length; i++) {
      initCardNav(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
