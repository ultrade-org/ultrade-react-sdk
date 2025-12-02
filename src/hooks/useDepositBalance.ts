import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { CodexBalanceDto } from '../utils/websocketHandlers/balanceHandlers';

/**
 * Codex balance mapped type (internal format)
 * Same as frontend: CodexBalance interface
 */
interface CodexBalance {
  loginAddress: string;
  loginChainId: number;
  tokenId: string;
  tokenChainId: number;
  availableAmount: string;
  lockedAmount: string;
}

/**
 * Deposit balance structure for selected pair
 */
export interface DepositBalance {
  base_available_balance: string;
  price_available_balance: string;
  base_locked_balance: string;
  price_locked_balance: string;
}

/**
 * Selected pair structure for balance calculation
 */
export interface SelectedPairForBalance {
  base_id: string;
  base_chain_id: number;
  price_id: string;
  price_chain_id: number;
}

/**
 * Helper function: Case-insensitive string comparison
 * Same as frontend: _utils/comman.ts:249-251
 */
function equalsIgnoreCase(str1: string | number, str2: string | number): boolean {
  return String(str1).toUpperCase() === String(str2).toUpperCase();
}

/**
 * Helper function: Check if asset matches by ID and chain ID
 * Same as frontend: _utils/comman.ts:253-255
 */
function findCorrectAsset(
  indx1: string, 
  indx2: string, 
  chain1: number, 
  chain2: number
): boolean {
  return equalsIgnoreCase(indx1, indx2) && chain1 === chain2;
}

/**
 * Map CodexBalanceDto to CodexBalance (internal format)
 * Same as frontend: _utils/mappers.ts:135-144
 */
function mapToCodexBalance(balance: CodexBalanceDto): CodexBalance {
  return {
    loginAddress: balance.loginAddress,
    loginChainId: balance.loginChainId,
    tokenId: balance.tokenAddress,
    tokenChainId: balance.tokenChainId,
    availableAmount: BigNumber(balance.amount).minus(balance.lockedAmount).toString(),
    lockedAmount: balance.lockedAmount,
  };
}

/**
 * Hook to transform balances array into deposit balance object for selected pair
 * Based on frontend logic from exchange.action.ts:221-229
 * 
 * @param balances - Array of CodexBalanceDto from RTK Query
 * @param selectedPair - Selected trading pair
 * @returns DepositBalance object with available and locked balances for base and price assets
 */
export function useDepositBalance(
  balances: unknown,
  selectedPair?: SelectedPairForBalance
): DepositBalance {
  return useMemo(() => {
    const defaultBalance: DepositBalance = {
      base_available_balance: '0',
      price_available_balance: '0',
      base_locked_balance: '0',
      price_locked_balance: '0',
    };

    if (!selectedPair || !balances || !Array.isArray(balances)) {
      return defaultBalance;
    }

    // Map CodexBalanceDto[] to CodexBalance[]
    // Same logic as exchange.action.ts:saveDepositBalance
    const mappedBalances = (balances as CodexBalanceDto[]).map(b => mapToCodexBalance(b));

    // Find base and price assets - same logic as exchange.action.ts:221-222
    const baseAsset = mappedBalances.find(b => 
      findCorrectAsset(b.tokenId, selectedPair.base_id, b.tokenChainId, selectedPair.base_chain_id)
    );
    const priceAsset = mappedBalances.find(b => 
      findCorrectAsset(b.tokenId, selectedPair.price_id, b.tokenChainId, selectedPair.price_chain_id)
    );

    // Calculate deposit balance - same logic as exchange.action.ts:223-229
    return {
      base_available_balance: baseAsset ? baseAsset.availableAmount : defaultBalance.base_available_balance,
      base_locked_balance: baseAsset ? baseAsset.lockedAmount : defaultBalance.base_locked_balance,
      price_available_balance: priceAsset ? priceAsset.availableAmount : defaultBalance.price_available_balance,
      price_locked_balance: priceAsset ? priceAsset.lockedAmount : defaultBalance.price_locked_balance,
    };
  }, [balances, selectedPair]);
}

