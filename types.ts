
export enum VerdictType {
  VERIFIED = 'VERIFIED',
  MISLEADING = 'MISLEADING',
  FALSE = 'FALSE',
  UNCERTAIN = 'UNCERTAIN',
  OPINION = 'OPINION',
  OUTDATED = 'OUTDATED',
  NOT_RECENT = 'NOT_RECENT'
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

export interface EvolutionStage {
  stage: number;
  platform: string;
  timestamp: string;
  variant: string;
  distortionScore: number;
}

export interface SocialAnalysis {
    sentiment: 'ANGRY' | 'FEARFUL' | 'HAPPY' | 'NEUTRAL' | 'DIVIDED';
    score: number; // 0 (Negative) - 100 (Positive)
    topNarrative: string; // "People are saying..."
    hotSpots: string[]; // Platforms e.g., ["Twitter", "Reddit"]
}

export interface Report {
  id: string;
  timestamp: number;
  topic: string;
  claim: string;
  verdict: VerdictType;
  summary: string;
  confidenceScore: number;
  sourceReliability: number;
  sources: Source[];
  tags: string[];
  originSector: string;
  detectedLanguage?: string;
  keyEvidence: KeyEvidence[];
  relatedThemes: string[];
  entities: string[];
  evolutionTrace?: EvolutionStage[];
  socialPulse?: SocialAnalysis; // NEW FIELD
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
