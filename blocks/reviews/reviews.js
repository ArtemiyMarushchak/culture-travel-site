const PAGE_SIZE_DEFAULT = 4;

export function initReviews(root) {
  if (!root || !root.hasAttribute('data-reviews-page-size')) return;

  const pageSize = Number(root.getAttribute('data-reviews-page-size')) || PAGE_SIZE_DEFAULT;
  const items = Array.from(root.querySelectorAll('[data-review-item]'));
  const moreWrap = root.querySelector('[data-reviews-more-wrap]');
  const moreBtn = root.querySelector('[data-reviews-more]');
  if (!items.length || !moreBtn) return;

  let visible = pageSize;

  function render() {
    items.forEach(function (item, index) {
      const hide = index >= visible;
      item.hidden = hide;
      item.classList.toggle('is-hidden', hide);
    });
    const hasMore = visible < items.length;
    if (moreWrap) moreWrap.hidden = !hasMore;
    moreBtn.hidden = !hasMore;
  }

  moreBtn.addEventListener('click', function () {
    visible += pageSize;
    render();
  });

  render();
}
