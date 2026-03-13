import { IGetPendingTransactionsResult, IWalletTransactionsState, IWalletTransferState } from "@interface";

export const initialWalletTransactionsState: IWalletTransactionsState = {
  deposit: [],
  withdraw: [],
}

export const initialWalletTransferState: IWalletTransferState = {
  transfer: [],
}

export const initialPendingState: IGetPendingTransactionsResult = { 
  pendingTxns: { deposit: [], withdraw: [], transfer: [] }, 
  pendingCount: 0
};
