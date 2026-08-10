export function initCaseTour() {
  const sliders = document.querySelectorAll('[data-tour-slider]');
  if (!sliders.length) return;

  sliders.forEach(function (slider) {
    const track = slider.querySelector('.tour-day__track');
    const slides = slider.querySelectorAll('.tour-day__slide');
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    const current = slider.querySelector('[data-current]');
    const total = slider.querySelector('[data-total]');

    if (!track || !slides.length || !prev || !next || !current || !total) return;

    let index = 0;
    const count = slides.length;

    function pad(n) {
      return String(n).padStart(2, '0');
    }

    function update() {
      track.style.transform = 'translateX(' + -index * 100 + '%)';
      current.textContent = pad(index + 1);
      total.textContent = pad(count);
    }

    prev.addEventListener('click', function () {
      index = index <= 0 ? count - 1 : index - 1;
      update();
    });

    next.addEventListener('click', function () {
      index = index >= count - 1 ? 0 : index + 1;
      update();
    });

    update();
  });
}
