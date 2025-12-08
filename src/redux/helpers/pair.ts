import { IPairSettings } from "@ultrade/shared/browser/interfaces";
import { IPairDto, ISettingsState, PairSettingsIds, IPair } from "@ultrade/ultrade-js-sdk";

import { atomicToDecimal, equalsIgnoreCase, roundTo, adjustFee } from "./formaters";

export const notRestrictedPairs = (pairs: IPairDto[], currentCountry: string) => {
  if(!currentCountry) return pairs;
  return pairs.filter(el => !el.restrictedCountries || !el.restrictedCountries.find(country => equalsIgnoreCase(country, currentCountry)));
};

export const buildPair = (pairDto: IPairDto, settings: Pick<ISettingsState, 'minFee'>): IPair => {
  const makerBaseFee = pairDto.pairSettings[PairSettingsIds.MAKER_FEE] || null;
  const takerBaseFee = pairDto.pairSettings[PairSettingsIds.TAKER_FEE] || null;
  return {
    ...pairDto,
    pairSettings: {
      mftTitle: pairDto.pairSettings[PairSettingsIds.MFT_TITLE] || "",
      baseCoinIconLink: pairDto.pairSettings[PairSettingsIds.VIEW_BASE_COIN_ICON_LINK] || "",
      audioLink: pairDto.pairSettings[PairSettingsIds.MFT_AUDIO_LINK] || "",
      baseCoinMarketLink: pairDto.pairSettings[PairSettingsIds.VIEW_BASE_COIN_MARKET_LINK] || "",
      priceCoinMarketLink: pairDto.pairSettings[PairSettingsIds.VIEW_PRICE_COIN_MARKET_LINK] || "",
      preSaleMode: pairDto.pairSettings[PairSettingsIds.MODE_PRE_SALE] || null,
      makerFee: makerBaseFee && adjustFee(+makerBaseFee, settings.minFee),
      takerFee: takerBaseFee && adjustFee(+takerBaseFee, settings.minFee),
    } as IPairSettings,
    current_price: atomicToDecimal(pairDto.current_price),
    h: atomicToDecimal(pairDto.h),
    l: atomicToDecimal(pairDto.l),
    l_p: pairDto.l_p ? atomicToDecimal(pairDto.l_p) : "",
    price_24: atomicToDecimal(pairDto.price_24),
    total_24: atomicToDecimal(pairDto.total_24),
    volume_24: atomicToDecimal(pairDto.volume_24, pairDto.base_decimal),
    change_24: pairDto.change_24 ? Number(roundTo(pairDto.change_24, 2)) : 0,
  }
}