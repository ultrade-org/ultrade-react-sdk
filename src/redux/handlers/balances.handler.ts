import { AccountAssetType, CodexBalance, CodexBalanceDto, IDepositBalance, IPair } from "@ultrade/ultrade-js-sdk";
import { findCorrectAsset, mapToCodexBalance } from "../helpers";
import { depositBalanceGuard } from "@helpers";

export const exchangeAssetsHandler = (data: AccountAssetType[] | CodexBalanceDto, prevAssets: AccountAssetType[]): AccountAssetType[] => {
  if (!depositBalanceGuard(data)) {
    return data;
  } else {
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
};

export const depositBalanceHandler = (data: CodexBalanceDto[], prevDepositBalance: IDepositBalance, selectedPair: IPair): IDepositBalance => {
  const balances = data.map(b => mapToCodexBalance(b));

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