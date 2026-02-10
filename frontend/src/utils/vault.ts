/**
 * Simple local storage vault for storing reveal secrets.
 * Maps marketId -> { outcome, secret }
 */

export interface SecretData {
    outcome: string;
    outcomeIndex: number;
    secret: string;
}

const VAULT_KEY = "phantombet_vault";

export const Vault = {
    saveSecret: (marketId: number | bigint, data: SecretData) => {
        const vault = Vault.getAll();
        vault[marketId.toString()] = data;
        localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    },

    getSecret: (marketId: number | bigint): SecretData | null => {
        const vault = Vault.getAll();
        return vault[marketId.toString()] || null;
    },

    getAll: (): Record<string, SecretData> => {
        try {
            const data = localStorage.getItem(VAULT_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    clear: () => {
        localStorage.removeItem(VAULT_KEY);
    }
};
