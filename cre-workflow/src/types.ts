/**
 * Type definitions for PhantomBet CRE Workflow
 */

export interface Market {
    id: number;
    question: string;
    outcomes: string[];
    bettingDeadline: number;
    revealDeadline: number;
    settled: boolean;
    finalOutcomeId: number;
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
    marketId: number;
    outcome: string;
    outcomeIndex: number;
    consensus: boolean;
    confidence: number;
    txHash?: string;
}

export interface ConsensusData {
    agreedOutcome: string;
    outcomeIndex: number;
    agreementCount: number;
    totalSources: number;
    confidence: number;
    sources: DataSource[];
}

export interface NewsAPIResponse {
    status: string;
    totalResults: number;
    articles: Array<{
        title: string;
        description: string;
        content: string;
        publishedAt: string;
        source: {
            name: string;
        };
    }>;
}

export interface OpenAIRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    temperature: number;
    max_tokens: number;
}

export interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}
