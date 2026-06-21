// Type definitions for Legal Document Intelligence Agent

export interface ContractAnalysis {
  contractId: string;
  contractType: string;
  uploadedAt: Date;
  clauses: ContractClause[];
  riskSummary: RiskSummary;
  counterClauses: CounterClause[];
}

export interface ContractClause {
  id: string;
  type: string;
  text: string;
  riskLevel: 'SAFE' | 'NEEDS_REVIEW' | 'HIGH';
  explanation: string;
  standardComparison?: string;
  position: number;
}

export interface RiskSummary {
  totalClauses: number;
  safeClauses: number;
  needsReviewClauses: number;
  highRiskClauses: number;
  keyRisks: string[];
  recommendedActions: string[];
}

export interface CounterClause {
  clauseId: string;
  originalText: string;
  revisedText: string;
  reasoning: string;
  riskReduction: number;
}

export interface ValidationResult {
  isValid: boolean;
  hallucination: boolean;
  bias: boolean;
  harmfulAdvice: boolean;
  riskScore: number;
  issues?: string[];
}

export interface SessionContext {
  sessionId: string;
  contractAnalysis: ContractAnalysis;
  conversationHistory: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ApiRequest {
  contractText?: string;
  contractType: string;
  fileName?: string;
  mimeType?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: ContractAnalysis;
  error?: string;
  message?: string;
}
