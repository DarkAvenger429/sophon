export enum VerdictType {
  VERIFIED = 'VERIFIED',
  MISLEADING = 'MISLEADING',
  FALSE = 'FALSE',
  UNCERTAIN = 'UNCERTAIN',
  OPINION = 'OPINION'
}

export enum SourceCategory {
  ACADEMIC = 'ACADEMIC',
  GOVERNMENT = 'GOVERNMENT',
  NEWS = 'NEWS',
  SOCIAL = 'SOCIAL',
  UNKNOWN = 'UNKNOWN'
}

export interface Source {
  title: string;
  url: string;
  category: SourceCategory;
  reliabilityScore: number; // 0-100
  date?: string; // ISO Date YYYY-MM-DD or relative string
}

export interface KeyEvidence {
  point: string;
  type: 'SUPPORTING' | 'CONTRADICTING';
}

export interface Report {
  id: string;
  timestamp: number;
  topic: string;
  claim: string;
  verdict: VerdictType;
  summary: string;
  confidenceScore: number;
  sourceReliability: number; // Aggregate reliability of used sources
  sources: Source[];
  tags: string[];
  originSector: string; // Where this topic was found (e.g. "Academic Database")
  detectedLanguage?: string; // e.g. "Hindi", "Marathi", "English"
  keyEvidence: KeyEvidence[]; // New field for CoVe (Chain of Verification)
  relatedThemes: string[]; // For Graph Clustering (e.g. "Election Fraud", "Climate Denial")
}

export enum AgentStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  VERIFYING = 'VERIFYING',
  REPORTING = 'REPORTING'
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'action' | 'error' | 'success' | 'warning';
}