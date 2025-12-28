import { IWalletTransactionsState, IWalletTransferState } from "@interface";

export const initialWalletTransactionsState: IWalletTransactionsState = {
  deposit: [],
  withdraw: [],
}

export const initialWalletTransferState: IWalletTransferState = {
  transfer: [],
}