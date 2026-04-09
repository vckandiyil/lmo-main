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
  '/api/laborForceComposition.json': 'laborForceComposition.json',
  '/api/laborForceTotal.json': 'laborForceTotal.json',
  '/api/laborForceNationality.json': 'laborForceNationality.json',
  '/api/laborForceGender.json': 'laborForceGender.json',
  '/api/marketEntrantsEducation.json': 'marketEntrantsEducation.json',
  '/api/marketEntrantsImmigration.json': 'marketEntrantsImmigration.json',
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
  '/api/executiveKpiStrip.json': 'executiveKpiStrip.json',
  '/api/industryShareJobs.json': 'industryShareJobs.json',
  '/api/industrySummaryTable.json': 'industrySummaryTable.json',
  '/api/skillLevelMixIndustry.json': 'skillLevelMixIndustry.json',
  '/api/sectorContributionOpenings.json': 'sectorContributionOpenings.json',
  '/api/sectorCityContribution.json': 'sectorCityContribution.json',
  '/api/topCompaniesPostings.json': 'topCompaniesPostings.json',
  '/api/contractTypeMixCompany.json': 'contractTypeMixCompany.json',
  '/api/companyConcentrationRisk.json': 'companyConcentrationRisk.json',
  '/api/jobTypeDistribution.json': 'jobTypeDistribution.json',
  '/api/remoteShareIndustry.json': 'remoteShareIndustry.json',
  '/api/topJobTitlesVolume.json': 'topJobTitlesVolume.json',
  '/api/jobTitleSectorMatrix.json': 'jobTitleSectorMatrix.json',
  '/api/topSkillsTreemap.json': 'topSkillsTreemap.json',
  '/api/skillsIndustryMatrix.json': 'skillsIndustryMatrix.json',
  '/api/skillLevelDemandMix.json': 'skillLevelDemandMix.json',
  '/api/jobDemandCityMap.json': 'jobDemandCityMap.json',
  '/api/industryCityHeatmap.json': 'industryCityHeatmap.json',
  '/api/remoteJobsMap.json': 'remoteJobsMap.json',
  '/api/salaryRangeRole.json': 'salaryRangeRole.json',
  '/api/salaryDemandBubble.json': 'salaryDemandBubble.json',
  '/api/experienceSalaryHeatmap.json': 'experienceSalaryHeatmap.json',
  '/api/titleSalaryHeatmap.json': 'titleSalaryHeatmap.json',
  '/api/highDemandHighSalary.json': 'highDemandHighSalary.json',
  '/api/highDemandLowSalary.json': 'highDemandLowSalary.json',
  '/api/jobsByExperienceLevel.json': 'jobsByExperienceLevel.json',
  '/api/juniorSeniorRatio.json': 'juniorSeniorRatio.json',
  '/api/careerPathFunnel.json': 'careerPathFunnel.json',
  '/api/workArrangementExperience.json': 'workArrangementExperience.json',
  '/api/educationLevelMixJobs.json': 'educationLevelMixJobs.json',
  '/api/educationIndustryHeatmap.json': 'educationIndustryHeatmap.json',
  '/api/avgDescriptionLength.json': 'avgDescriptionLength.json',
  '/api/languageJobsDistribution.json': 'languageJobsDistribution.json',
  '/api/jobsCompanySize.json': 'jobsCompanySize.json',
  '/api/skillAdjacencyNetwork.json': 'skillAdjacencyNetwork.json',
  '/api/applicantTotalKpi.json': 'applicantTotalKpi.json',
  '/api/applicantAbuDhabiPct.json': 'applicantAbuDhabiPct.json',
  '/api/applicantMedianExperience.json': 'applicantMedianExperience.json',
  '/api/applicantRoleFamily.json': 'applicantRoleFamily.json',
  '/api/applicantSeniorityMix.json': 'applicantSeniorityMix.json',
  '/api/applicantExperienceBands.json': 'applicantExperienceBands.json',
  '/api/applicantCityTop15.json': 'applicantCityTop15.json',
  '/api/applicantTopSkills.json': 'applicantTopSkills.json',
  '/api/applicantCertifications.json': 'applicantCertifications.json',
  '/api/applicantEducationMix.json': 'applicantEducationMix.json',
  '/api/applicantSkillIndustry.json': 'applicantSkillIndustry.json',
  '/api/applicantTenureBands.json': 'applicantTenureBands.json',
  '/api/applicantMobilityScore.json': 'applicantMobilityScore.json',
  '/api/applicantHoppingRisk.json': 'applicantHoppingRisk.json',
  '/api/adTalentPoolKpi.json': 'adTalentPoolKpi.json',
  '/api/sectorReadinessHeatmap.json': 'sectorReadinessHeatmap.json',
  '/api/risingSkillsAd.json': 'risingSkillsAd.json',
  '/api/certificationStrengthSector.json': 'certificationStrengthSector.json',
  '/api/seniorityPyramidAd.json': 'seniorityPyramidAd.json',
  '/api/talentSourceConcentration.json': 'talentSourceConcentration.json',
  '/api/skillAdjacencyNetworkAd.json': 'skillAdjacencyNetworkAd.json',
  '/api/maritalActivityStatus.json': 'maritalActivityStatus.json',
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
