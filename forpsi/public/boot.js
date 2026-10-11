// Keep the photograph visible while the interactive client loads, without flashing
// the readable server fallback. Restore that fallback if the client cannot start.
document.documentElement.classList.add('forpsi-booting');
window.zubyBootTimer = setTimeout(() => {
  document.documentElement.classList.remove('forpsi-booting');
}, 10000);
