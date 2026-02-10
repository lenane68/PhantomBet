export const PREDICTION_MARKET_ADDRESS = import.meta.env.VITE_PREDICTION_MARKET_ADDRESS as `0x${string}`;
export const CRE_ORACLE_ADDRESS = import.meta.env.VITE_CRE_ORACLE_ADDRESS as `0x${string}`;

export const PREDICTION_MARKET_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "marketId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "bettor",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "commitment",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "BetPlaced",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "marketId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "bettor",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "outcome",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "BetRevealed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "marketId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "question",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "bettingDeadline",
                "type": "uint256"
            }
        ],
        "name": "MarketCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "marketId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "outcome",
                "type": "string"
            }
        ],
        "name": "MarketSettled",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "marketId",
                "type": "uint256"
            }
        ],
        "name": "claimWinnings",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "question",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "outcomes",
                "type": "string[]"
            },
            {
                "internalType": "uint256",
                "name": "duration",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "revealDuration",
                "type": "uint256"
            }
        ],
        "name": "createMarket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "marketId",
                "type": "uint256"
            }
        ],
        "name": "markets",
        "outputs": [
            { "name": "id", "type": "uint256" },
            { "name": "question", "type": "string" },
            { "name": "bettingDeadline", "type": "uint256" },
            { "name": "revealDeadline", "type": "uint256" },
            { "name": "revealed", "type": "bool" },
            { "name": "finalOutcomeId", "type": "uint256" },
            { "name": "settled", "type": "bool" },
            { "name": "totalPool", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nextMarketId",
        "outputs": [{ "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "marketId", "type": "uint256" },
            { "internalType": "bytes32", "name": "commitment", "type": "bytes32" }
        ],
        "name": "placeBet",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "marketId", "type": "uint256" },
            { "internalType": "uint256", "name": "outcomeIndex", "type": "uint256" },
            { "internalType": "string", "name": "secret", "type": "string" },
            { "internalType": "uint256", "name": "betIndex", "type": "uint256" }
        ],
        "name": "revealBet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;
