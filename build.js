const fs   = require('fs');
const path = require('path');
const { marked } = require('marked');

const POSTS_DIR  = path.join(__dirname, 'posts');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DIST_DIR   = path.join(__dirname, 'dist');
const POST_DIST  = path.join(DIST_DIR, 'post');

// 确保输出目录存在
if (!fs.existsSync(DIST_DIR))  fs.mkdirSync(DIST_DIR, { recursive: true });
if (!fs.existsSync(POST_DIST)) fs.mkdirSync(POST_DIST, { recursive: true });

// 读取并解析所有文章
function parsePost(filename) {
  const filePath = path.join(POSTS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const meta = {};
  let bodyStart = 0;
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') { bodyStart = i + 1; break; }
      const idx = lines[i].indexOf(':');
      if (idx > -1) {
        meta[lines[i].substring(0, idx).trim()] = lines[i].substring(idx + 1).trim();
      }
    }
  }
  return {
    id:      filename.replace('.md', ''),
    title:   meta.title || filename.replace('.md', ''),
    date:    meta.date  || '',
    tags:    meta.tags  ? meta.tags.split(',').map(t => t.trim()) : [],
    summary: meta.summary || '',
    body:    marked(lines.slice(bodyStart).join('\n'))
  };
}

const files  = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).sort().reverse();
const posts  = files.map(parsePost).filter(Boolean);

// —— 生成文章详情页 dist/post/[id].html ——
function generatePostHTML(post) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(post.title)} - 小姚的太空博客</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <canvas id="starfield"></canvas>
  <div class="container">
    <header class="site-header">
      <a href="/" class="back-link">← 返回星海</a>
      <h1 class="site-title">${escHtml(post.title)}</h1>
      <div class="post-meta">
        <span>📅 ${escHtml(post.date)}</span>
        ${post.tags.length ? '<span style="margin-left:1.2em;">🏷️ ' + post.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join(' ') + '</span>' : ''}
      </div>
    </header>
    <main>
      <article class="post-content glass-card">${post.body}</article>
    </main>
    <footer class="site-footer">
      <p>© 2026 小姚的太空博客 · Powered by Vercel</p>
    </footer>
  </div>
  <script src="/js/post.js"></script>
</body>
</html>`;
}

posts.forEach(post => {
  fs.writeFileSync(path.join(POST_DIST, post.id + '.html'), generatePostHTML(post), 'utf-8');
});
console.log(`✅ 生成了 ${posts.length} 篇文章详情页`);

// —— 生成首页 dist/index.html ——
function generateIndexHTML() {
  const listHTML = posts.length
    ? posts.map(p => `
      <a class="post-card glass-card" href="/post/${p.id}.html">
        <h2>${escHtml(p.title)}</h2>
        <div class="post-date">${escHtml(p.date)}</div>
        <div class="post-summary">${escHtml(p.summary || '暂无摘要')}</div>
        ${p.tags.length ? '<div class="post-tags">' + p.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('') + '</div>' : ''}
      </a>`).join('\n')
    : '<p class="loading">星空中还没有文章，用 Git 添加第一篇文章吧 ✨</p>';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小姚的太空博客</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <canvas id="starfield"></canvas>
  <div class="container">
    <header class="site-header">
      <h1 class="site-title">🚀 小姚的太空博客</h1>
      <p class="site-desc">记录生活中的每一颗星星</p>
    </header>
    <main>
      <div class="posts-list">${listHTML}</div>
    </main>
    <footer class="site-footer">
      <p>© 2026 小姚的太空博客 · Powered by Vercel</p>
    </footer>
  </div>
  <script src="/js/index.js"></script>
</body>
</html>`;
}

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), generateIndexHTML(), 'utf-8');
console.log('✅ 生成首页 index.html');

// —— 复制 public/ 下所有文件到 dist/ ——
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(f => {
    const s = path.join(src, f);
    const d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) { copyDir(s, d); }
    else { fs.copyFileSync(s, d); }
  });
}
copyDir(PUBLIC_DIR, DIST_DIR);
console.log('✅ 静态资源已复制到 dist/');

// —— 生成 404 页 ——
fs.writeFileSync(path.join(DIST_DIR, '404.html'), `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>404 - 迷失在太空中</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><canvas id="starfield"></canvas>
<div class="container" style="text-align:center;padding-top:20vh;">
  <h1 style="font-size:4rem;">🛸 404</h1>
  <p style="color:#7b8ba8;font-size:1.2rem;margin:1rem 0;">页面迷失在黑洞中了</p>
  <a href="/" style="color:#4fc3f7;text-decoration:none;font-size:1rem;">← 返回星海</a>
</div><script src="/js/index.js"></script></body></html>`, 'utf-8');

console.log('\n🚀 静态站点构建完成！输出目录：dist/\n');

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
