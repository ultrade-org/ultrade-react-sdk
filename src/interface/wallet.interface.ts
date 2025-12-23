import { ITransaction, ITransfer } from "@ultrade/ultrade-js-sdk";

export interface IWalletState {
  deposit: ITransaction[],
  withdraw: ITransaction[],
  transfer: ITransfer[]
};