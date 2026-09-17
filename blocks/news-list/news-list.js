const PAGE_SIZE_DEFAULT = 4;

export function initNewsList(root) {
  if (!root || !root.hasAttribute('data-news-page-size')) return;

  const pageSize = Number(root.getAttribute('data-news-page-size')) || PAGE_SIZE_DEFAULT;
  const items = Array.from(root.querySelectorAll('[data-news-item]'));
  const moreWrap = root.querySelector('[data-news-more-wrap]');
  const moreBtn = root.querySelector('[data-news-more]');
  if (!items.length || !moreBtn) return;

  let visible = pageSize;

  function render() {
    items.forEach(function (item, index) {
      item.hidden = index >= visible;
      item.classList.toggle('is-hidden', index >= visible);
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
