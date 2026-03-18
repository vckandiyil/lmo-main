const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const JSON_DIR = path.join(__dirname, '../src/assets/server-api-jsons');

// Routes mirror the asset filenames so the same URL suffix works in prod (assets/) and dev (/api/).
const routes = {
  '/api/dashboard.json': 'dashboard.json',
  '/api/widgets-catalog.json': 'widgets-catalog.json',
  '/api/notifications.json': 'notifications.json',
  '/api/news.json': 'news.json',
  '/api/compare.json': 'compare.json',
  '/api/presentation.json': 'presentation.json',
  '/api/ai-overview.json': 'ai-overview.json',
  '/api/labourMarketPolicies.json': 'labourMarketPolicies.json',
  '/api/unemployment.json': 'unemployment.json',
  '/api/employmentRate.json': 'employmentRate.json',
  '/api/populationNumber.json': 'populationNumber.json',
  '/api/widgets-detail-config.json': 'widgets-detail-config.json',
  '/api/widget-ai-insights.json': 'widget-ai-insights.json',
};

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
