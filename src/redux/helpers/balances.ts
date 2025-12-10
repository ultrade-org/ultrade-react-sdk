import BigNumber from "bignumber.js";
import { AccountAssetType, CodexAsset, CodexBalance, CodexBalanceDto } from "@ultrade/ultrade-js-sdk";
import { equalsIgnoreCase } from "./formaters";
import { assetsJson } from "@assets";
import { trustWalletChains } from "@consts";

export function mapToCodexBalance(balance: CodexBalanceDto): CodexBalance {
  return {
    loginAddress: balance.loginAddress,
    loginChainId: balance.loginChainId,
    tokenId: balance.tokenAddress,
    tokenChainId: balance.tokenChainId,
    availableAmount: BigNumber(balance.amount).minus(balance.lockedAmount).toString(),
    lockedAmount: balance.lockedAmount,
  }
}

export function findCorrectAsset(indx1: string, indx2: string, chain1: number, chain2: number) {
  return equalsIgnoreCase(indx1, indx2) && chain1 === chain2
}

export function addBalanceToAsset(asset:AccountAssetType, balance?: CodexBalance) {
  return {
    ...asset,
    amount: balance?.availableAmount || "",
    lockedAmount: balance?.lockedAmount || "",
  }
}

export const getAssetImage = ({address, chainId, unitName}: {address: string, chainId: number, unitName: string}) => {
  const asset = assetsJson[unitName];
  if (asset && asset.logo && asset.logo.png) {
    return asset.logo.png;
  } else {
    const url = `https://raw.githubusercontent.com/trustwallet/assets/refs/heads/master/blockchains/${trustWalletChains[chainId]}/assets/${address}/logo.png`;
    return url;
  }
};

export function mapAsset(asset: CodexAsset, balance?: CodexBalance): AccountAssetType {
  const assetImage = getAssetImage({
    address: asset.address,
    chainId: asset.chainId,
    unitName: asset.unitName
  });
  return {
    id: asset.id,
    index: asset.address,
    name: asset.name,
    decimal: asset.decimals,
    img: asset.img || assetImage,
    amount: balance?.availableAmount || "",
    lockedAmount: balance?.lockedAmount || "",
    unit_name: asset.unitName,
    usd_value: 0,
    chainId: asset.chainId,
    isWrapped: asset.isGas,
  } as AccountAssetType;
}

export const prepareAssets = (assets: AccountAssetType[], balances: CodexBalanceDto[]) => assets.map(asset => {
  const balance = balances?.find(b => findCorrectAsset(asset.index, b.tokenAddress, asset.chainId, b.tokenChainId))
  return addBalanceToAsset(asset, balance ? mapToCodexBalance(balance) : undefined)
})