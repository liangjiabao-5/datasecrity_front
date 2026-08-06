export interface BusinessSystem {
  id: string;
  systemName: string;
  businessFunction: string;
  serviceObject: string;
  userScale: string;
  coverageArea: string;
  classifiedProtectionLevel: string;
  relatedDepartments: string;
  dataScopes: string[];
  topologyFileId?: string;
  businessFlowFileId?: string;
}

export interface DataProcessorBasicSurvey {
  unitName: string;
  unifiedSocialCreditCode: string;
  officeAddress: string;
  legalRepresentative: string;
  staffSize: string;
  businessScope: string;
  dataSecurityOfficer: string;
  contactInfo: string;
  unitNature: string;
  specificProcessorType: string;
  powerIndustryCategory: string;
  businessOperationArea: string;
  dataProcessingLocation: string;
  mainBusinessScope: string;
  businessScale: string;
  administrativeLicense: string;
}

export interface SurveyDiagramFile {
  fileId: string;
  fileName: string;
  objectKey?: string;
  storageProvider?: string;
  bucketName?: string;
  contentType?: string;
  fileSize?: number;
  bizType?: 'SURVEY_TOPOLOGY_DIAGRAM' | 'SURVEY_DATA_FLOW_DIAGRAM' | string;
  downloadUrl?: string;
}

export interface BusinessSystemDiagramUploadResult {
  file: SurveyDiagramFile;
  businessSystem: Pick<BusinessSystem, 'id' | 'topologyFileId' | 'businessFlowFileId'>;
}

export interface SurveyWordImportResult {
  dataProcessorBasic?: Partial<DataProcessorBasicSurvey>;
  businessSystem?: Partial<BusinessSystem>;
  processingActivity?: Partial<ProcessingActivitySurvey>;
  securityProtection?: Partial<SecurityProtection>;
  counts?: {
    dataAssets?: number;
    personalInfo?: number;
    importantData?: number;
    coreData?: number;
  };
}

export interface DataAsset {
  id: string;
  businessSystemId: string;
  dataName: string;
  dataForm: string;
  dataScope: string;
  dataScale: string;
  dataSource: string;
  storageLocation: string;
  flowDescription: string;
  classified: boolean;
  dataCategory: string;
  dataLevel: string;
  personalInfo: boolean;
}

export interface SpecialDataRecord {
  id: string;
  dataName?: string;
  dataCategory: string;
  scale: string;
  sensitivity?: string;
  dataSource?: string;
  businessFlow?: string;
  processingActivities?: string[];
  description?: string;
}

export type SpecialDataType = 'personal-info' | 'important-data' | 'core-data';

export type ProcessingActivityType =
  | 'COLLECT'
  | 'TRANSFER'
  | 'STORE'
  | 'USE_PROCESS'
  | 'PROVIDE'
  | 'PUBLIC'
  | 'DELETE';

export interface ProcessingActivity {
  id: string;
  activityType: ProcessingActivityType;
  scenario: string;
  method: string;
  scale: string;
  involvesPersonalInfo: boolean;
  protectionMeasures: string[];
  description: string;
}

export interface SecurityProtection {
  [key: string]: string | string[] | undefined;
  complianceAssessmentStatus?: string;
  dataSecurityManagement?: string;
  networkSecurityDevicesAndPolicies?: string;
  identityAuthenticationAndAccessControl?: string;
  vulnerabilityManagement?: string;
  remoteManagementSoftware?: string;
  accountPasswordManagement?: string;
  securityTechnologyApplication?: string;
  isPowerMonitoringSystem?: string;
  productionControlAreaProtection?: string;
  securityAccessAreaSetup?: string;
  powerMonitoringDedicatedNetwork?: string;
  zoneIsolationDeviceUsage?: string;
  wideAreaNetworkConnectionSecurity?: string;
  powerDispatchAuthentication?: string;
  networkServiceSecurityControl?: string;
  securityAccessAreaSecurityControl?: string;
  zoneBoundaryProtection?: string;
  productSecurityReliability?: string;
  operatorSecurityMonitoringWarning?: string;
  securityIncidentsAndThreats?: string;
  detectedThreats?: string;
  publicThreatAlerts?: string;
  otherSecurityThreats?: string;
}

export interface ProcessingActivitySurvey {
  involvedActivities: ProcessingActivityType[];
  collectionChannels: string;
  collectionMethod: string;
  collectionDataScope: string;
  collectionPurpose: string;
  collectionFrequency: string;
  collectionExternalSources: string;
  collectionContracts: string;
  collectionRelatedSystems: string;
  collectionPublicDeviceUsage: string;
  storageDataScope: string;
  storageMethod: string;
  dataCenter: string;
  storageSystem: string;
  externalStorageProvider: string;
  storageLocation: string;
  storageDuration: string;
  backupRedundancyStrategy: string;
  transferDataScope: string;
  transferDataLinkInventory: string;
  onlineChannel: string;
  offlineTransfer: string;
  transferProtocol: string;
  dataInterface: string;
  useDataScope: string;
  usePurpose: string;
  useMethod: string;
  useScope: string;
  useScenario: string;
  algorithmRules: string;
  processingDetails: string;
  algorithmRecommendationService: string;
  entrustedOrJointProcessing: string;
  provideDataScope: string;
  providePurpose: string;
  provideMethod: string;
  provideScope: string;
  dataRecipients: string;
  provideContracts: string;
  providedPersonalInfoAndImportantData: string;
  publicDataScope: string;
  publicPurpose: string;
  publicMethod: string;
  publicScope: string;
  publicAudienceSize: string;
  publicDataTypes: string;
  publicDataScale: string;
  deletionDataScope: string;
  deletionScenarios: string;
  deletionMethod: string;
  dataArchive: string;
  mediaDestruction: string;
  crossBorderDataScope: string;
  crossBorderPresence: string;
  crossBorderDescription: string;
}
