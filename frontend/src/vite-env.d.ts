/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PREDICTION_MARKET_ADDRESS: string
    readonly VITE_CRE_ORACLE_ADDRESS: string
    readonly VITE_ARBITRUM_SEPOLIA_RPC: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
