const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const POSTS_DIR = path.join(process.cwd(), 'posts');

module.exports = (req, res) => {
  try {
    const postId = req.query.id || req.url.split('?')[0].split('/').pop();
    const filename = postId.endsWith('.md') ? postId : postId + '.md';
    const filePath = path.join(POSTS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    const meta = {};
    let bodyStart = 0;
    if (lines[0] === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') { bodyStart = i + 1; break; }
        const idx = lines[i].indexOf(':');
        if (idx > -1) {
          const key = lines[i].substring(0, idx).trim();
          const val = lines[i].substring(idx + 1).trim();
          meta[key] = val;
        }
      }
    }
    const body = lines.slice(bodyStart).join('\n');
    res.status(200).json({
      id: postId.replace('.md', ''),
      title: meta.title || postId,
      date: meta.date || '',
      tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
      summary: meta.summary || '',
      body: marked(body)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
