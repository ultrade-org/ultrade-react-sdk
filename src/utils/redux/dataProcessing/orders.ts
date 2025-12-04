import { amountValueFormate } from "@redux/helpers";

export const calculateOrder = (array: string[][], baseDecimal: number) => array?.map(arr => {
  return [
    arr[0],
    arr[1],
    amountValueFormate(BigNumber(arr[0]).multipliedBy(arr[1]).toString(), baseDecimal)
  ]
});