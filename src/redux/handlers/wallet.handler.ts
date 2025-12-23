import { ACTION_TYPE, ITransaction, ITransfer, OperationStatusEnum } from "@ultrade/ultrade-js-sdk";
import { equalsIgnoreCase } from "../helpers";
import { IWalletState } from "@interface";

export const saveUserWalletTransactions = (type: ACTION_TYPE, data: ITransaction[] | ITransfer[], prevWalletState: IWalletState): IWalletState => {
  equalsIgnoreCase(type, ACTION_TYPE.T)
    ? data.sort((a, b) => b.transferId - a.transferId)
    : data.sort((a, b) => b.primaryId - a.primaryId)
    
  return {
    ...prevWalletState,
    [type]: data,
  }
}


export const updateUserWalletTransactions = (newData: ITransaction, walletState: IWalletState): IWalletState => {
  const txnType = newData.action_type;
  const walletTransactions = walletState[txnType];
  const existingTransactionIndex = walletTransactions.findIndex(transaction => transaction.primaryId === newData.primaryId);
  // dispatch(updatePendingTxnsCount(newData, walletTransactions[existingTransactionIndex]));

  let updatedWalletTransactions;
  if (existingTransactionIndex !== -1) {
    const exsistItem = walletTransactions.find((oldItem: ITransaction) => oldItem.primaryId === newData.primaryId);
    if (equalsIgnoreCase(exsistItem.status, OperationStatusEnum.Completed)) return;

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

export const updateTransferTransactions = (newData: ITransfer, walletState: IWalletState): IWalletState => {
  const walletTransfers = walletState.transfer;
  const existingIndex = walletTransfers.findIndex(transaction => transaction.transferId === newData.transferId);
  // dispatch(updatePendingTxnsCount(newData, walletTransfers[existingIndex]));

  let updatedWalletTransfers;
  if (existingIndex !== -1) {
    const isTxnUpdated = new Date(walletTransfers[existingIndex].completedAt).getTime() >= new Date(newData.completedAt).getTime();
    if (isTxnUpdated) return;

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