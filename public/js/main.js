// Inkwell — light client-side enhancements (no framework needed)

document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss flash messages after a few seconds
  document.querySelectorAll('.flash').forEach((el) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    }, 4000);
  });
});
