import { MAX_TOKEN_DECIMAL } from "@ultrade/shared/browser/constants";

// 1000000 => 1
export const amountValueFormate = (amount: string | BigNumber, decimal: number): string => {
  if (amount && BigNumber(amount).isGreaterThan(0) && decimal >= 0) {
    return BigNumber(amount).shiftedBy(-Number(decimal)).decimalPlaces(MAX_TOKEN_DECIMAL, 1).toString();
  }
  return "0";
};