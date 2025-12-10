import { IDepositBalanceTransformedResult, IExchangeAssetsTransformedResult } from "@interface";

export const initialExchangeAssetsState: IExchangeAssetsTransformedResult = []

export const initialDepositBalanceState: IDepositBalanceTransformedResult = {
    base_available_balance: "0",
    price_available_balance: "0",
    base_locked_balance: "0",
    price_locked_balance: "0",
}