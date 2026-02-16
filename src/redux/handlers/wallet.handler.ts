import { ACTION_TYPE, ITransaction, ITransfer, OperationStatusEnum } from "@ultrade/ultrade-js-sdk";
import { equalsIgnoreCase } from "../helpers";
import { IWalletTransactionsState, IWalletTransferState } from "@interface";

export const saveUserWalletTransactions = (type: ACTION_TYPE, data: ITransaction[], prevWalletState: IWalletTransactionsState): IWalletTransactionsState => {
  return {
    ...prevWalletState,
    [type]: data.sort((a, b) => b.primaryId - a.primaryId),
  }
}

export const saveUserWalletTransfer = (data: ITransfer[]): IWalletTransferState => {
  return {
    [ACTION_TYPE.T]: data.sort((a, b) => b.transferId - a.transferId)
  }
}


export const updateUserWalletTransactions = (newData: ITransaction, walletState: IWalletTransactionsState): IWalletTransactionsState => {
  const txnType = newData.action_type === ACTION_TYPE.F ? ACTION_TYPE.D : newData.action_type;
  const walletTransactions = walletState?.[txnType];

  if (!walletTransactions || !Array.isArray(walletTransactions)) {
    return {
      ...walletState,
      [txnType]: [newData]
    };
  }

  const existingTransactionIndex = walletTransactions.findIndex(transaction => transaction.primaryId === newData.primaryId);
  // dispatch(updatePendingTxnsCount(newData, walletTransactions[existingTransactionIndex]));

  let updatedWalletTransactions;
  if (existingTransactionIndex !== -1) {
    const exsistItem = walletTransactions[existingTransactionIndex];
    if (equalsIgnoreCase(exsistItem.status, OperationStatusEnum.Completed)) {
      return walletState;
    }

    updatedWalletTransactions = [...walletTransactions];
    updatedWalletTransactions[existingTransactionIndex] = newData;
  } else {
    updatedWalletTransactions = [newData, ...walletTransactions];
  }
  return {
    ...walletState,
    [txnType]: updatedWalletTransactions.sort((a, b) => b.primaryId - a.primaryId) 
  }
}

export const updateTransferTransactions = (newData: ITransfer, walletState: IWalletTransferState): IWalletTransferState => {
  const walletTransfers = walletState?.transfer;

  if (!walletTransfers || !Array.isArray(walletTransfers)) {
    return {
      ...walletState,
      transfer: [newData]
    };
  }

  const existingIndex = walletTransfers.findIndex(transaction => transaction.transferId === newData.transferId);
  // dispatch(updatePendingTxnsCount(newData, walletTransfers[existingIndex]));

  let updatedWalletTransfers;
  if (existingIndex !== -1) {
    const isTxnUpdated = new Date(walletTransfers[existingIndex].completedAt).getTime() >= new Date(newData.completedAt).getTime();
    if (isTxnUpdated) {
      return walletState;
    }

    updatedWalletTransfers = [...walletTransfers];
    updatedWalletTransfers[existingIndex] = {...updatedWalletTransfers[existingIndex], ...newData};
  } else {
    updatedWalletTransfers = [newData, ...walletTransfers];
  }

  return {
    ...walletState,
    [ACTION_TYPE.T]: updatedWalletTransfers.sort((a, b) => b.transferId - a.transferId)
  }
}