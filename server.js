const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = 3000;
const POSTS_DIR = path.join(__dirname, 'posts');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/posts', express.static(POSTS_DIR));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 获取所有文章列表
app.get('/api/posts', (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).sort().reverse();
    const posts = files.map(filename => {
      const filePath = path.join(POSTS_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const meta = {};
      let bodyStart = 0;
      if (lines[0] === '---') {
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === '---') { bodyStart = i + 1; break; }
          const [key, ...rest] = lines[i].split(':');
          meta[key.trim()] = rest.join(':').trim();
        }
      }
      return {
        id: filename.replace('.md', ''),
        title: meta.title || filename.replace('.md', ''),
        date: meta.date || '',
        tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
        summary: meta.summary || lines.slice(bodyStart, bodyStart + 3).join(' ').substring(0, 100)
      };
    });
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 获取单篇文章
app.get('/api/posts/:id', (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.id + '.md');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const meta = {};
    let bodyStart = 0;
    if (lines[0] === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') { bodyStart = i + 1; break; }
        const [key, ...rest] = lines[i].split(':');
        meta[key.trim()] = rest.join(':').trim();
      }
    }
    const body = lines.slice(bodyStart).join('\n');
    res.json({
      id: req.params.id,
      title: meta.title || req.params.id,
      date: meta.date || '',
      tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
      summary: meta.summary || '',
      body: marked(body)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 新建文章
app.post('/api/posts', (req, res) => {
  try {
    const { title, date, tags, summary, body } = req.body;
    const id = title.replace(/[^\w\u4e00-\u9fa5]+/g, '-').toLowerCase().substring(0, 50);
    const filePath = path.join(POSTS_DIR, id + '.md');
    const frontMatter = `---\ntitle: ${title}\ndate: ${date || new Date().toISOString().split('T')[0]}\ntags: ${(tags || []).join(', ')}\nsummary: ${summary || ''}\n---\n\n${body || ''}`;
    fs.writeFileSync(filePath, frontMatter, 'utf-8');
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 删除文章
app.delete('/api/posts/:id', (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.id + '.md');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 文章页
app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/post.html'));
});

// 管理页
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.listen(PORT, () => {
  console.log(`\n✨  小姚的太空博客已启动！`);
  console.log(`🚀  访问地址: http://localhost:${PORT}`);
  console.log(`🌌  管理后台: http://localhost:${PORT}/admin\n`);
});
