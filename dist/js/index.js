// ===== 星空粒子动画 =====
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [], shootingStars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // 普通星星
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.0008 + 0.0003,
      phase: Math.random() * Math.PI * 2
    });
  }

  function addShootingStar() {
    if (shootingStars.length > 3) return;
    shootingStars.push({
      x: Math.random() * w * 0.8 + w * 0.2,
      y: Math.random() * h * 0.3,
      len: Math.random() * 80 + 40,
      speed: Math.random() * 4 + 3,
      alpha: 1,
      angle: Math.PI / 4 + Math.random() * 0.3
    });
  }
  setInterval(addShootingStar, 2500 + Math.random() * 3000);

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    // 星星闪烁
    stars.forEach(s => {
      const flicker = Math.sin(t * s.speed + s.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${s.alpha * flicker})`;
      ctx.fill();
    });
    // 流星
    shootingStars = shootingStars.filter(ss => {
      ss.x -= Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.alpha -= 0.012;
      if (ss.alpha <= 0) return false;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x + Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len);
      const grad = ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x + Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len
      );
      grad.addColorStop(0, `rgba(150,200,255,${ss.alpha})`);
      grad.addColorStop(1, `rgba(150,200,255,0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return true;
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// ===== 加载文章列表 =====
fetch('/api/posts')
  .then(r => r.json())
  .then(posts => {
    const container = document.getElementById('posts-list');
    if (!posts.length) {
      container.innerHTML = '<p class="loading">星空中还没有文章，去写第一篇吧 ✨</p>';
      return;
    }
    container.innerHTML = posts.map(p => `
      <a class="post-card glass-card" href="/post?id=${p.id}">
        <h2>${escHtml(p.title)}</h2>
        <div class="post-date">${escHtml(p.date || '')}</div>
        <div class="post-summary">${escHtml(p.summary || '暂无摘要')}</div>
        ${p.tags && p.tags.length ? '<div class="post-tags">' + p.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('') + '</div>' : ''}
      </a>
    `).join('');
  })
  .catch(() => {
    document.getElementById('posts-list').innerHTML =
      '<p class="loading">无法连接星际服务器，请稍后再试 🛸</p>';
  });

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
