export function initHeader(root) {
  const burger = root.querySelector('.header__burger');
  const nav = root.querySelector('.header__nav');

  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  window.addEventListener('scroll', () => {
    root.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });
}
