export function initReviews(root) {
  if (!root) return;

  const tabs = root.querySelectorAll('[data-review-tab]');
  const panels = root.querySelectorAll('[data-review-panel]');
  if (!tabs.length || !panels.length) return;

  function activate(tabId) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.reviewTab === tabId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.reviewPanel === tabId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activate(tab.dataset.reviewTab);
    });
  });
}
