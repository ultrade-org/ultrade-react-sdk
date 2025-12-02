import { AnyAction } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';
import BigNumber from 'bignumber.js';

import { marketsPairsApi } from '@api/markets/pairs.api';

const FACTOR_PRICE_DECIMAL = 18;
const MAX_TOKEN_DECIMAL = 18;

// ============================================================================
// frontend/src/_utils/comman.ts:249-251
// ============================================================================
const equalsIgnoreCase = (str1: string | number, str2: string | number): boolean => {
  return String(str1).toUpperCase() === String(str2).toUpperCase();
};

// ============================================================================
// frontend/src/_utils/mappers.ts:30-33
// Filters pairs by country restrictions
// ============================================================================
const notRestrictedPairs = (pairs: any[], currentCountry: string | undefined): any[] => {
  if(!currentCountry) return pairs;
  return pairs.filter(el => 
    !el.restrictedCountries || 
    !el.restrictedCountries.find((country: string) => equalsIgnoreCase(country, currentCountry))
  );
};

// ============================================================================
// frontend/src/_utils/comman.ts:111-116
// ============================================================================
const amountValueFormate = (amount: string | BigNumber, decimal: number): string => {
  if (amount && BigNumber(amount).isGreaterThan(0) && decimal >= 0) {
    return BigNumber(amount).shiftedBy(-Number(decimal)).decimalPlaces(MAX_TOKEN_DECIMAL, 1).toString();
  }
  return "0";
};

// ============================================================================
// frontend/src/_utils/mappers.ts:40-42
// ============================================================================
const atomicToDecimal = (value: string, decimal: number = FACTOR_PRICE_DECIMAL): string => {
  return value ? amountValueFormate(value, decimal) : "0";
};

// ============================================================================
// frontend/src/_utils/comman.ts:95-100
// ============================================================================
const roundTo = (amount: string | number, decimal: number): string => {
  if (amount && decimal >= 0) {
    return BigNumber(amount).decimalPlaces(Number(decimal), 1).toString();
  }
  return "0";
};

// ============================================================================
// PairSettings IDs - same as frontend/src/interfaces/index.ts
// ============================================================================
enum PairSettingsIds {
  MFT_TITLE = 'MFT_TITLE',
  VIEW_BASE_COIN_ICON_LINK = 'VIEW_BASE_COIN_ICON_LINK',
  MFT_AUDIO_LINK = 'MFT_AUDIO_LINK',
  VIEW_BASE_COIN_MARKET_LINK = 'VIEW_BASE_COIN_MARKET_LINK',
  VIEW_PRICE_COIN_MARKET_LINK = 'VIEW_PRICE_COIN_MARKET_LINK',
  MODE_PRE_SALE = 'MODE_PRE_SALE',
  MAKER_FEE = 'MAKER_FEE',
  TAKER_FEE = 'TAKER_FEE',
}

// ============================================================================
// frontend/src/_utils/mappers.ts:35-38
// Adjusts fee with minimum fee constraint
// ============================================================================
const adjustFee = (fee: number, minFee: number): number => {
  const convertedFee = fee / 100;
  return convertedFee < minFee ? minFee : convertedFee;
};

// ============================================================================
// frontend/src/_utils/mappers.ts:44-68
// Note: Now includes pairSettings transformation and minFee support
// ============================================================================
const buildPair = (pairDto: any, settings?: { minFee: number }): any => {
  const makerBaseFee = pairDto.pairSettings?.[PairSettingsIds.MAKER_FEE] || null;
  const takerBaseFee = pairDto.pairSettings?.[PairSettingsIds.TAKER_FEE] || null;
  
  return {
    ...pairDto,
    pairSettings: pairDto.pairSettings ? {
      mftTitle: pairDto.pairSettings[PairSettingsIds.MFT_TITLE] || "",
      baseCoinIconLink: pairDto.pairSettings[PairSettingsIds.VIEW_BASE_COIN_ICON_LINK] || "",
      audioLink: pairDto.pairSettings[PairSettingsIds.MFT_AUDIO_LINK] || "",
      baseCoinMarketLink: pairDto.pairSettings[PairSettingsIds.VIEW_BASE_COIN_MARKET_LINK] || "",
      priceCoinMarketLink: pairDto.pairSettings[PairSettingsIds.VIEW_PRICE_COIN_MARKET_LINK] || "",
      preSaleMode: pairDto.pairSettings[PairSettingsIds.MODE_PRE_SALE] || null,
      makerFee: makerBaseFee && settings?.minFee ? adjustFee(+makerBaseFee, settings.minFee) : makerBaseFee,
      takerFee: takerBaseFee && settings?.minFee ? adjustFee(+takerBaseFee, settings.minFee) : takerBaseFee,
    } : pairDto.pairSettings,
    current_price: atomicToDecimal(pairDto.current_price),
    h: atomicToDecimal(pairDto.h),
    l: atomicToDecimal(pairDto.l),
    l_p: pairDto.l_p ? atomicToDecimal(pairDto.l_p) : "",
    price_24: atomicToDecimal(pairDto.price_24),
    total_24: atomicToDecimal(pairDto.total_24),
    volume_24: atomicToDecimal(pairDto.volume_24, pairDto.base_decimal),
    change_24: pairDto.change_24 ? Number(roundTo(pairDto.change_24, 2)) : 0,
  };
};

// ============================================================================
// frontend/src/redux/_actions/exchange.action.ts:346-374
// export const saveListOfPairs = (data: IPairDto[], selectedPairId: number = null) => (dispatch, getState) => {
//   const listOfPairs = getState().exchange.listOfPairs;                    // line 347
//   const cacheMFT = getState().exchange.mftCached;                          // line 348
//   const minFee = getState().settings.minFee;                               // line 349
//   const isMFT = data.some(el => el.pairSettings[...]);                    // line 351
//   if (cacheMFT !== isMFT) { dispatch({ type: actionTypes.SAVE_MFT, ... }); } // line 352-357
//   const pairsData = data.map(el => {                                      // line 359
//     const buildEl = buildPair(el, { minFee });                            // line 360
//     const oldPair = listOfPairs.find((p: IPair) => equalsIgnoreCase(p.pair_key, el.pair_key)); // line 361
//     return oldPair ? {...oldPair, ...buildEl} : buildEl;                 // line 362
//   });
//   pairsData.sort((a, b) => (a.pair_name > b.pair_name ? 1 : b.pair_name > a.pair_name ? -1 : 0)); // line 365
//   dispatch({ type: actionTypes.SAVE_LIST_OF_PAIRS, data: pairsData });   // line 366
//   const currentPair = pairsData.find(el => el.id === selectedPairId);    // line 368
//   if (!currentPair) { dispatch(saveSelectedPair(pairsData[0])); }        // line 369-370
//   else { dispatch(saveSelectedPair(currentPair)); }                      // line 371-373
// };
//
// RTK equivalent: Updates cache directly instead of dispatching Redux actions
// Now includes: Country filtering, pairSettings transformation, minFee support
// Skips: MFT cache check, selectedPair update (handled by React components)
// ============================================================================
export function handleAllStat(
  dispatch: Dispatch,
  store: any,
  pairStats: any[],
  currentCountry: string | undefined,
  companyId: number
) {
  // line 349: Get minFee from settings
  const minFee = store.getState()?.settings?.minFee || 0;

  const filteredPairs = notRestrictedPairs(pairStats, currentCountry);

  dispatch(
    // @ts-ignore
    marketsPairsApi.util.updateQueryData("getPairList", companyId, (draft: any[]) => {
      if (!draft || !Array.isArray(draft)) {
        return filteredPairs.map(el => buildPair(el, { minFee })).sort((a, b) => 
          a.pair_name > b.pair_name ? 1 : b.pair_name > a.pair_name ? -1 : 0
        );
      }

      // line 359-363: Map and merge with existing data
      const pairsData = filteredPairs.map(el => {
        const buildEl = buildPair(el, { minFee }); // line 360 - now with minFee
        const oldPair = draft.find((p: any) => equalsIgnoreCase(p.pair_key, el.pair_key)); // line 361
        return oldPair ? { ...oldPair, ...buildEl } : buildEl; // line 362
      });

      // line 365: Sort by pair_name
      pairsData.sort((a, b) => 
        a.pair_name > b.pair_name ? 1 : b.pair_name > a.pair_name ? -1 : 0
      );

      return pairsData;
    }) as unknown as AnyAction
  );
}

