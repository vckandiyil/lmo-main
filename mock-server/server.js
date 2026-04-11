const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const JSON_DIR = path.join(__dirname, '../src/assets/server-api-jsons');

// Auto-discover every JSON file in the asset directory and expose it under /api/<filename>.
// Any new JSON dropped into src/assets/server-api-jsons is served automatically — no edits needed.
const routes = Object.fromEntries(
  fs.readdirSync(JSON_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => [`/api/${f}`, f])
);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];
  const file = routes[url];

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Route not found: ${url}` }));
    return;
  }

  const filePath = path.join(JSON_DIR, file);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Failed to read: ${file}`, detail: err.message }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\nMock API server running at http://localhost:${PORT}\n`);
  console.log('Endpoints:');
  Object.keys(routes).forEach(route =>
    console.log(`  GET http://localhost:${PORT}${route}`)
  );
  console.log('');
});
