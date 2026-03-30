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
  '/api/presentation.json': 'presentation.json',
  '/api/ai-overview.json': 'ai-overview.json',
  '/api/labourMarketPolicies.json': 'labourMarketPolicies.json',
  '/api/unemploymentRate.json': 'unemploymentRate.json',
  '/api/employmentRate.json': 'employmentRate.json',
  '/api/populationNumber.json': 'populationNumber.json',
  '/api/widget-ai-insights.json': 'widget-ai-insights.json',
  '/api/emiratisation.json': 'emiratisation.json',
  '/api/laborForceParticipation.json': 'laborForceParticipation.json',
  '/api/vacancyRate.json': 'vacancyRate.json',
  '/api/vacanciesOverTime.json': 'vacanciesOverTime.json',
  '/api/vacanciesByEntity.json': 'vacanciesByEntity.json',
  '/api/hiringProgress.json': 'hiringProgress.json',
  '/api/salaryDistribution.json': 'salaryDistribution.json',
  '/api/vacanciesByLocation.json': 'vacanciesByLocation.json',
  '/api/vacanciesByOccupation.json': 'vacanciesByOccupation.json',
  '/api/vacanciesByQualification.json': 'vacanciesByQualification.json',
  '/api/vacancyStatusAndType.json': 'vacancyStatusAndType.json',
  '/api/vacancyStatusBreakdown.json': 'vacancyStatusBreakdown.json',
  '/api/genderDistributionPie.json': 'genderDistributionPie.json',
  '/api/employeesByCitizenship.json': 'employeesByCitizenship.json',
  '/api/genderDistribution.json': 'genderDistribution.json',
  '/api/distributionByAgeGroup.json': 'distributionByAgeGroup.json',
  '/api/distributionBySector.json': 'distributionBySector.json',
  '/api/distributionByOccupation.json': 'distributionByOccupation.json',
  '/api/distributionByEducationLevel.json': 'distributionByEducationLevel.json',
  '/api/distributionBySalaryBand.json': 'distributionBySalaryBand.json',
  '/api/talentPoolTreemap.json': 'talentPoolTreemap.json',
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
