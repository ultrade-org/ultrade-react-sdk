import { FRONTEND_FEE_SCALE } from "@ultrade/shared/browser/constants";
import BigNumber from 'bignumber.js';
import { FACTOR_PRICE_DECIMAL, MAX_TOKEN_DECIMAL } from '@ultrade/shared/browser/constants';

// 1000000 => 1
export const amountValueFormate = (amount: string | BigNumber, decimal: number): string => {
  if (amount && BigNumber(amount).isGreaterThan(0) && decimal >= 0) {
    return BigNumber(amount).shiftedBy(-Number(decimal)).decimalPlaces(MAX_TOKEN_DECIMAL, 1).toString();
  }
  return '0';
};

export function equalsIgnoreCase(str1: string | number, str2: string | number) {
  return String(str1).toUpperCase() === String(str2).toUpperCase();
}

export const convertJsonToArray = (setting: string | null) => {
  return JSON.parse(setting ?? '[]');
};

export const atomicToDecimal = (value: string, decimal: number = FACTOR_PRICE_DECIMAL) => {
  return value ? amountValueFormate(value, decimal) : '0';
};

// 10.49986434 => 10.4
export const roundTo = (amount: string | number, decimal: number): string => {
  if (amount && decimal >= 0) {
    return BigNumber(amount).decimalPlaces(Number(decimal), 1).toString();
  }
  return '0';
};

export const convertSettingToBoolean = (setting: string, byDefault?: boolean | null) => {
  if (!setting) return byDefault;
  return setting !== "false"
};

export const convertFeeToPrecent = (value: string | number) => {
  if (Number(value) > 0) {
    return Number((Number(value) / FRONTEND_FEE_SCALE).toFixed(6));
  }
  return 0;
};

export const adjustFee = (fee: number, minFee: number) => {
  if (!fee) return 0;
  return convertFeeToPrecent(BigNumber(fee).plus(minFee).toString());
}

export const sortByDate = (a: number | string | Date, b: number | string | Date) => new Date(b).getTime() - new Date(a).getTime();

