// Zero-dependency static server WITH HTTP Range support (Safari needs it for <video>) — Design C (port 8092).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/djiko/Desktop/Skills_Academy/basketcamp-kolasin-v3';
const PORT = 8092;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime'
};

http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    let fp = path.normalize(path.join(ROOT, urlPath));
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.stat(fp, (err, st) => {
      if (!err && st.isDirectory()) fp = path.join(fp, 'index.html');
      fs.stat(fp, (e2, stat) => {
        if (e2 || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
        const type = TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream';
        const range = req.headers.range;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
          let start = m[1] ? parseInt(m[1], 10) : 0;
          let end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
          if (isNaN(start)) start = 0;
          if (isNaN(end) || end >= stat.size) end = stat.size - 1;
          if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }); return res.end(); }
          res.writeHead(206, {
            'Content-Type': type,
            'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
            'Accept-Ranges': 'bytes',
            'Content-Length': (end - start + 1),
            'Cache-Control': 'no-store'
          });
          fs.createReadStream(fp, { start: start, end: end }).pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Type': type,
            'Content-Length': stat.size,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          });
          fs.createReadStream(fp).pipe(res);
        }
      });
    });
  } catch (ex) { res.writeHead(500); res.end('Server error'); }
}).listen(PORT, '127.0.0.1', () => console.log('basketcamp Design C (range-enabled) on http://127.0.0.1:' + PORT));
