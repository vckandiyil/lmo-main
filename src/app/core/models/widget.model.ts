/**
 * Enum of all available widget types in the application.
 */
export enum WidgetType {
  MarketEntrants = 'market-entrants',
  LaborForceComposition = 'labor-force-composition',
  SectorGapsOpportunities = 'sector-gaps-opportunities',
  UnemploymentRate = 'unemployment-rate',
  WorkforceStructure = 'workforce-structure',
  EmploymentRate = 'employment-rate',
  EmploymentRateTrend = 'employment-rate-trend',
  Employment = 'employment',
  AiInsights = 'ai-insights',
  RegionProfile = 'region-profile',
  MaritalActivityStatus = 'marital-activity-status',
  PopulationNumber = 'population-number',
  GapAnalysis = 'supply-and-demand',
  Map = 'map',
  Emiratisation = 'emiratisation',
  LaborForceParticipation = 'labor-force-participation',
  VacancyRate = 'vacancy-rate',
  EmployeesByCitizenship = 'employees-by-citizenship',
  GenderDistribution = 'gender-distribution',
  DistributionByAgeGroup = 'distribution-by-age-group',
  DistributionBySector = 'distribution-by-sector',
  DistributionByOccupation = 'distribution-by-occupation',
  DistributionByEducationLevel = 'distribution-by-education-level',
  DistributionBySalaryBand = 'distribution-by-salary-band',
  TalentPoolTreemap = 'talent-pool-treemap',
  VacanciesOverTime = 'vacancies-over-time',
  VacanciesByEntity = 'vacancies-by-entity',
  HiringProgress = 'hiring-progress',
  SalaryDistribution = 'salary-distribution',
  VacanciesByLocation = 'vacancies-by-location',
  VacanciesByOccupation = 'vacancies-by-occupation',
  VacanciesByQualification = 'vacancies-by-qualification',
  VacancyStatusAndType = 'vacancy-status-and-type',
  VacancyStatusBreakdown = 'vacancy-status-breakdown',
  GenderDistributionPie = 'gender-distribution-pie',
  MarketEntrantsEducation = 'market-entrants-education',
  MarketEntrantsImmigration = 'market-entrants-immigration',
  LaborForceTotal = 'labor-force-total',
  LaborForceNationality = 'labor-force-nationality',
  LaborForceGender = 'labor-force-gender',
  WorkforceAgeDistribution = 'workforce-age-distribution',
  WorkforceGenderNationality = 'workforce-gender-nationality',
  WagesAndIncome = 'wages-and-income',
  PensionsAndSocialProtection = 'pensions-and-social-protection',
  // Section 1: Job Demand
  ExecutiveKpiStrip = 'executive-kpi-strip',
  IndustryShareJobs = 'industry-share-jobs',
  IndustrySummaryTable = 'industry-summary-table',
  SkillLevelMixIndustry = 'skill-level-mix-industry',
  SectorContributionOpenings = 'sector-contribution-openings',
  SectorCityContribution = 'sector-city-contribution',
  TopCompaniesPostings = 'top-companies-postings',
  ContractTypeMixCompany = 'contract-type-mix-company',
  CompanyConcentrationRisk = 'company-concentration-risk',
  JobTypeDistribution = 'job-type-distribution',
  RemoteShareIndustry = 'remote-share-industry',
  TopJobTitlesVolume = 'top-job-titles-volume',
  JobTitleSectorMatrix = 'job-title-sector-matrix',
  TopSkillsTreemap = 'top-skills-treemap',
  SkillsIndustryMatrix = 'skills-industry-matrix',
  SkillLevelDemandMix = 'skill-level-demand-mix',
  JobDemandCityMap = 'job-demand-city-map',
  IndustryCityHeatmap = 'industry-city-heatmap',
  RemoteJobsMap = 'remote-jobs-map',
  SalaryRangeRole = 'salary-range-role',
  SalaryDemandBubble = 'salary-demand-bubble',
  ExperienceSalaryHeatmap = 'experience-salary-heatmap',
  TitleSalaryHeatmap = 'title-salary-heatmap',
  HighDemandHighSalary = 'high-demand-high-salary',
  HighDemandLowSalary = 'high-demand-low-salary',
  JobsByExperienceLevel = 'jobs-by-experience-level',
  JuniorSeniorRatio = 'junior-senior-ratio',
  CareerPathFunnel = 'career-path-funnel',
  WorkArrangementExperience = 'work-arrangement-experience',
  EducationLevelMixJobs = 'education-level-mix-jobs',
  EducationIndustryHeatmap = 'education-industry-heatmap',
  AvgDescriptionLength = 'avg-description-length',
  LanguageJobsDistribution = 'language-jobs-distribution',
  JobsCompanySize = 'jobs-company-size',
  SkillAdjacencyNetwork = 'skill-adjacency-network',
  // Section 2: Job Applicant Intelligence
  ApplicantTotalKpi = 'applicant-total-kpi',
  ApplicantAbuDhabiPct = 'applicant-abu-dhabi-pct',
  ApplicantMedianExperience = 'applicant-median-experience',
  ApplicantRoleFamily = 'applicant-role-family',
  ApplicantSeniorityMix = 'applicant-seniority-mix',
  ApplicantExperienceBands = 'applicant-experience-bands',
  ApplicantCityTop15 = 'applicant-city-top15',
  ApplicantTopSkills = 'applicant-top-skills',
  ApplicantCertifications = 'applicant-certifications',
  ApplicantEducationMix = 'applicant-education-mix',
  ApplicantSkillIndustry = 'applicant-skill-industry',
  ApplicantTenureBands = 'applicant-tenure-bands',
  ApplicantMobilityScore = 'applicant-mobility-score',
  ApplicantHoppingRisk = 'applicant-hopping-risk',
  // Section 3: Talent Pool Intelligence
  AdTalentPoolKpi = 'ad-talent-pool-kpi',
  SectorReadinessHeatmap = 'sector-readiness-heatmap',
  RisingSkillsAd = 'rising-skills-ad',
  CertificationStrengthSector = 'certification-strength-sector',
  SeniorityPyramidAd = 'seniority-pyramid-ad',
  TalentSourceConcentration = 'talent-source-concentration',
  SkillAdjacencyNetworkAd = 'skill-adjacency-network-ad',
}

/**
 * Widget identifier type.
 * Uses the widget type value as a stable identifier for persistence.
 */
export type WidgetIdentifier = `widget-${WidgetType}`;

/**
 * Creates a stable widget identifier from a widget type.
 * @param type - The widget type
 * @returns A unique, stable identifier for the widget
 */
export function createWidgetId(type: WidgetType): WidgetIdentifier {
  return `widget-${type}`;
}

/**
 * Widget configuration interface.
 * Represents a widget instance in a sidebar.
 */
export interface Widget {
  id: WidgetIdentifier;
  type: WidgetType;
}

/**
 * Sidebar identifier type.
 */
export type SidebarPosition = 'left' | 'right';
