import { AccountAssetType, CodexAsset, CodexBalance, CodexBalanceDto, IDepositBalance, IPair } from "@ultrade/ultrade-js-sdk";
import { findCorrectAsset, mapAsset, mapToCodexBalance } from "../helpers";

export const saveExchangeAssetsHandler = (data: CodexAsset[]): AccountAssetType[] => {
  return data.map(asset => mapAsset(asset, undefined));
}

export const updateExchangeAssetsHandler = (data: CodexBalanceDto, prevAssets: AccountAssetType[]): AccountAssetType[] => {
  const balance = mapToCodexBalance(data);
  const updatedAssets = prevAssets.map((a) => {
    return !findCorrectAsset(a.index, balance.tokenId, a.chainId, balance.tokenChainId)
      ? a
      : {
        ...a,
        amount: balance.availableAmount,
        lockedAmount: balance.lockedAmount,
      }
  });
  return updatedAssets;
}

export const depositBalanceHandler = (data: CodexBalanceDto[], prevDepositBalance: IDepositBalance, selectedPair?: IPair): IDepositBalance => {
  const balances = data.map(b => mapToCodexBalance(b));
  if (!selectedPair) {
    return prevDepositBalance;
  }

  const baseAsset = balances.find(b => findCorrectAsset(b.tokenId, selectedPair.base_id, b.tokenChainId, selectedPair.base_chain_id));
  const priceAsset = balances.find(b => findCorrectAsset(b.tokenId, selectedPair.price_id, b.tokenChainId, selectedPair.price_chain_id));
  const newBalance = {
    ...prevDepositBalance,
    base_available_balance: baseAsset ? baseAsset.availableAmount : prevDepositBalance.base_available_balance,
    base_locked_balance: baseAsset ? baseAsset.lockedAmount : prevDepositBalance.base_locked_balance,
    price_available_balance: priceAsset ? priceAsset.availableAmount : prevDepositBalance.price_available_balance,
    price_locked_balance: priceAsset ? priceAsset.lockedAmount : prevDepositBalance.price_locked_balance,
  }
  return newBalance;
};