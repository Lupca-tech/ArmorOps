export type SystemEnvironment = 'Production' | 'Staging' | 'Development' | 'QA';
export type DataSensitivity = 'PII' | 'Confidential' | 'Regulated' | 'Internal' | 'Public';
export type ComplianceFramework = 'NIST' | 'CIS' | 'PCI-DSS' | 'HIPAA' | 'GDPR';

export interface SystemScope {
  environments: SystemEnvironment[];
  dataSensitivities: DataSensitivity[];
  compliances: ComplianceFramework[];
}

export interface Vulnerability {
  id: string;
  description: string;
  severity: string; // Technical severity (e.g., High)
  contextualRisk: string; // Final risk score (e.g., Critical)
  violatedRule: string;
  vulnerableCodeSnippet: string;
  category: string; // e.g., 'Access Control', 'Network Security'
  riskScore?: number; // Newly added field for the calculated, stable score
}

export interface RiskFactor {
    name: string; // e.g., 'Application', 'Data Security'
    status: 'good' | 'bad' | 'neutral';
}

export interface AnalysisResult {
    overallScore: number; // A numerical score e.g., 747
    riskFactors: RiskFactor[];
    vulnerabilities: Vulnerability[];
}


export interface AnalysisSession {
  id:string;
  timestamp: string;
  scope: any; // Allow 'any' for backward compatibility with old history items
  iacCode?: string; // Optional for backward compatibility
  iacFiles?: { name: string; content: string; }[];
  result: AnalysisResult;
}