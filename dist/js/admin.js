// ===== 星空粒子动画（复用）=====
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
    stars.forEach(s => {
      const flicker = Math.sin(t * s.speed + s.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${s.alpha * flicker})`;
      ctx.fill();
    });
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

// ===== 日期默认今天 =====
document.getElementById('post-date-input').value = new Date().toISOString().split('T')[0];

// ===== 预览功能 =====
document.getElementById('btn-preview').addEventListener('click', () => {
  const body = document.getElementById('post-body-input').value;
  const area = document.getElementById('preview-area');
  if (!body.trim()) { area.style.display = 'none'; return; }
  area.style.display = 'block';
  // 简易 Markdown 解析（标题、加粗、列表）
  let html = body
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>');
  area.innerHTML = html;
});

// ===== 提交文章 =====
document.getElementById('btn-submit').addEventListener('click', async () => {
  const title = document.getElementById('post-title-input').value.trim();
  const date  = document.getElementById('post-date-input').value;
  const tags  = document.getElementById('post-tags-input').value.trim();
  const summary = document.getElementById('post-summary-input').value.trim();
  const body  = document.getElementById('post-body-input').value.trim();
  const msgEl = document.getElementById('msg');

  if (!title) { msgEl.className = 'msg error'; msgEl.textContent = '⚠️ 请输入文章标题'; return; }
  if (!body)  { msgEl.className = 'msg error'; msgEl.textContent = '⚠️ 请输入文章正文'; return; }

  msgEl.className = 'msg';
  msgEl.textContent = '🚀 正在发射到星空...';

  try {
    const resp = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date,
        tags: tags ? tags.split(/,|，/).map(t => t.trim()).filter(Boolean) : [],
        summary,
        body
      })
    });
    const data = await resp.json();
    if (data.success) {
      msgEl.className = 'msg success';
      msgEl.textContent = '✅ 发布成功！正在跳转到文章...';
      setTimeout(() => { location.href = '/post?id=' + data.id; }, 1200);
    } else {
      msgEl.className = 'msg error';
      msgEl.textContent = '❌ 发布失败：' + (data.error || '未知错误');
    }
  } catch (e) {
    msgEl.className = 'msg error';
    msgEl.textContent = '❌ 网络错误，请检查服务是否启动';
  }
});
