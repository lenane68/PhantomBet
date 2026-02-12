/**
 * Type definitions for PhantomBet CRE Workflow
 */

export interface Market {
    id: bigint;
    question: string;
    outcomes: string[];
    bettingDeadline: bigint;
    revealDeadline: bigint;
    settled: boolean;
    finalOutcomeId: bigint;
    totalPool: bigint;
}

export interface DataSource {
    name: string;
    data: string;
    confidence: number;
    timestamp: number;
}

export interface AIAnalysisResult {
    outcome: string;
    outcomeIndex: number;
    confidence: number;
    reasoning: string;
    sources: DataSource[];
}

export interface SettlementResult {
    marketId: bigint;
    outcome: string;
    consensus: boolean;
    confidence: number;
    txStatus?: string;
    txHash?: string;
}

export interface NewsAPIResponse {
    status: string;
    totalResults: number;
    articles: Array<{
        title: string;
        description: string;
        url: string;
        publishedAt: string;
    }>;
}

export interface ConsensusData {
    agreedOutcome: string;
    outcomeIndex: number;
    agreementCount: number;
    totalSources: number;
    confidence: number;
    sources: DataSource[];
}
