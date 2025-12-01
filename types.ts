
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

export interface CommunityVotes {
    up: number;   // "Confirmed"
    down: number; // "Disputed"
    userVoted?: 'up' | 'down' | null; // Local user state
}

export interface CommunityNote {
    id: string;
    text: string;
    sourceUrl?: string;
    isVerified: boolean; // AI Audited
    timestamp: number;
}

export interface PatientZero {
    platform: string;
    username: string; // e.g. "@dark_knight"
    timestamp: string;
    contentFragment: string; // "The first mention..."
    estimatedReach: string; // "Low" or "1.2M"
    accountAge?: string; // "New" or "Established"
}

export interface TimelineEvent {
    date: string;
    description: string;
    source: string;
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
  socialPulse?: SocialAnalysis;
  timeContext?: 'Breaking' | 'Recent' | 'Old' | 'Very Old';
  communityVotes?: CommunityVotes;
  communityNotes?: CommunityNote[];
  
  // New Deep Intel Fields
  patientZero?: PatientZero;
  timeline?: TimelineEvent[];
  psychologicalTriggers?: string[]; // e.g., "Fear", "Tribalism", "Urgency"
  beneficiaries?: string[]; // Who benefits from this?
}

export interface NewsItem {
    id: string;
    headline: string;
    summary: string;
    source: string;
    time: string;
    url: string;
    upvotes: number;
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
