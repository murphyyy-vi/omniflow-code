import type { Campus, RadarData } from './dorm';

export type ConflictLevel = 'warning' | 'danger';

export interface MatchConflict {
  level: ConflictLevel;
  /** Generic, privacy-safe reason text. */
  reason: string;
}

export interface MatchDimensionScores {
  routine: number;
  hygiene: number;
  social: number;
  environment: number;
  study: number;
}

export interface MatchCandidate {
  candidateId: string;
  displayName: string;
  major: string;
  campus: Campus;
  publicTags: string[];
  compatibilityScore: number;
  dimensionScores: MatchDimensionScores;
  radar: {
    me: RadarData;
    candidate: RadarData;
  };
  conflicts: MatchConflict[];
  summaryText: string;
  icebreakers: string[];
}

/** Shape of GET /api/match/results */
export interface MatchResultsResponse {
  candidates: MatchCandidate[];
  rematchRemaining: number;
}

/** Shape of GET /api/chat/:matchId/icebreakers */
export interface IcebreakersResponse {
  matchId: string;
  topics: string[];
  source: 'llm' | 'template';
  refreshCount: number;
}
