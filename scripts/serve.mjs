import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.argv.includes('--dist') ? 'dist' : '.');
const port = Number(process.env.PORT || 5186);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.json':'application/json','.txt':'text/plain; charset=utf-8'};
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || /(?:^|[\\/])(?:materiais|node_modules|\.git)(?:[\\/]|$)/.test(file.slice(root.length))) { res.writeHead(403); res.end(); return; }
    if (!(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Arquivo não encontrado'); }
}).listen(port,'127.0.0.1',()=>console.log(`Craft Brand: http://127.0.0.1:${port}`));
