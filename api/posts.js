const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const POSTS_DIR = path.join(process.cwd(), 'posts');

function parseMd(filename) {
  const filePath = path.join(POSTS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
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
  return {
    id: filename.replace('.md', ''),
    title: meta.title || filename.replace('.md', ''),
    date: meta.date || '',
    tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
    summary: meta.summary || '',
    bodyStart,
    rawBody: lines.slice(bodyStart).join('\n')
  };
}

module.exports = (req, res) => {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).sort().reverse();
    const posts = files.map(filename => {
      const p = parseMd(filename);
      return {
        id: p.id,
        title: p.title,
        date: p.date,
        tags: p.tags,
        summary: p.summary || p.rawBody.substring(0, 100).replace(/\n/g, ' ')
      };
    });
    res.status(200).json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
