import { useReadContract, useReadContracts } from 'wagmi';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../contracts';

export interface Market {
    id: bigint;
    question: string;
    outcomes: string[];
    bettingDeadline: bigint;
    revealDeadline: bigint;
    revealed: boolean;
    finalOutcomeId: bigint;
    settled: boolean;
    totalPool: bigint;
}

export function useMarkets() {
    const { data: nextMarketId } = useReadContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'nextMarketId',
    });

    const marketCount = nextMarketId ? Number(nextMarketId) : 0;

    const { data: marketsData, isLoading: isLoadingMarkets } = useReadContracts({
        contracts: Array.from({ length: marketCount }).map((_, i) => ({
            address: PREDICTION_MARKET_ADDRESS,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'markets',
            args: [BigInt(i)],
        })),
    });

    const { data: outcomesData, isLoading: isLoadingOutcomes } = useReadContracts({
        contracts: Array.from({ length: marketCount }).map((_, i) => ({
            address: PREDICTION_MARKET_ADDRESS,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'getMarketOutcomes',
            args: [BigInt(i)],
        })),
    });

    const isLoading = isLoadingMarkets || isLoadingOutcomes;

    const markets: Market[] = marketsData
        ? marketsData
            .map((res, i) => {
                if (res.status === 'success' && res.result) {
                    const r = res.result as any;
                    const outcomesRes = outcomesData?.[i];
                    const outcomes = (outcomesRes?.status === 'success')
                        ? (outcomesRes.result as unknown as string[])
                        : ["Yes", "No"];

                    return {
                        id: BigInt(i),
                        question: r[1],
                        outcomes,
                        bettingDeadline: r[2],
                        revealDeadline: r[3],
                        revealed: r[4],
                        finalOutcomeId: r[5],
                        settled: r[6],
                        totalPool: r[7],
                    };
                }
                return null;
            })
            .filter((m): m is Market => m !== null)
        : [];

    return { markets, isLoading };
}
