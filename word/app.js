// Controller Logic, Web Audio API, Keyboard Events
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  initGame('daily');
  
  window.addEventListener('keydown', (e) => handleKeyPress(e.key.toLowerCase()));
});
