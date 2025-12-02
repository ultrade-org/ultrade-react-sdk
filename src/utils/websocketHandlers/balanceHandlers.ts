import { AnyAction } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';

import { marketsBalancesApi } from '@api/markets';

/**
 * Codex balance DTO from API and WebSocket
 */
export interface CodexBalanceDto {
  hash: string;
  loginAddress: string;
  loginChainId: number;
  tokenId: number;
  tokenAddress: string;
  tokenChainId: number;
  amount: string;
  lockedAmount: string;
}

/**
 * Codex balance event from WebSocket
 */
export interface CodexBalancesEvent {
  data: CodexBalanceDto;
}

/**
 * Handle codex balances update via WebSocket
 * Frontend equivalent: dispatch(saveExchangeAssets(balance)) + dispatch(saveDepositBalance([balance]))
 * 
 * Implements UPSERT logic from frontend code (your provided example):
 * - If balance exists: update amount and lockedAmount
 * - If balance NOT exists: insert (push) new balance
 * 
 * This function updates the balance cache directly without additional HTTP request
 * When cache updates, components using useGetBalancesQuery + useDepositBalance will automatically re-render
 */
export function handleCodexBalances(
  dispatch: Dispatch,
  balanceEvent: CodexBalancesEvent
) {
  const rawBalance = balanceEvent?.data;
  
  if (!rawBalance) {
    console.warn('[RTK Balances] Invalid balance data');
    return;
  }

  // Update RTK Query cache with UPSERT logic (same as frontend saveDepositBalance)
  dispatch(
    marketsBalancesApi.util.updateQueryData('getBalances', undefined, (draft: CodexBalanceDto[] | undefined) => {
      if (!draft) {
        return [rawBalance];
      }

      const existingIndex = draft.findIndex(
        (b) =>
          b.tokenAddress === rawBalance.tokenAddress &&
          b.tokenChainId === rawBalance.tokenChainId
      );

      if (existingIndex !== -1) {
        draft[existingIndex].amount = rawBalance.amount;
        draft[existingIndex].lockedAmount = rawBalance.lockedAmount;
      } else {
        draft.push(rawBalance);
      }
    }) as unknown as AnyAction
  );
}


