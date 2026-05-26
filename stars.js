(function () {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const COUNT = 180;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x:         Math.random() * canvas.width,
        y:         Math.random() * canvas.height,
        r:         Math.random() * 1.1 + 0.3,
        baseAlpha: Math.random() * 0.3  + 0.08,
        phase:     Math.random() * Math.PI * 2,
        speed:     Math.random() * 0.5  + 0.15,
      });
    }
  }

  function draw(ts) {
    const t = ts * 0.001;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const alpha = Math.max(0, s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.13);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 230, 224, ${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  initStars();
  requestAnimationFrame(draw);

  window.addEventListener('resize', () => { resize(); initStars(); });
})();
