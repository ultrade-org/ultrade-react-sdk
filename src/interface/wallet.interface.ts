import { IPendingTxn, ITransaction, ITransfer } from "@ultrade/ultrade-js-sdk";
export interface IWalletTransactionsState {
  deposit: ITransaction[],
  withdraw: ITransaction[],
}
export interface IWalletTransferState {
  transfer: ITransfer[],
}

export interface IGetPendingTransactionsResult {
  pendingTxns: {
    [key: string]: IPendingTxn[]
  },
  pendingCount: number,
}
