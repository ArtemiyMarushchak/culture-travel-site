export function initHeroVideo(root) {
  const video = root.querySelector('.hero-video__video');
  if (!video) return;

  // Pause video if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
    video.removeAttribute('autoplay');
  }
}
