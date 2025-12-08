import { IPairDto, PairSettingsIds, SettingIds } from "@ultrade/ultrade-js-sdk";
import { IPair } from "@ultrade/shared/browser/interfaces";

import { IGetPairListTransformedResult } from "@interface";
import { convertJsonToArray, equalsIgnoreCase, buildPair, notRestrictedPairs } from "../helpers";

interface BuildPairsDataArgs {
  originalData: IPairDto[];
  currentCountry?: string;
  cachedSettings: any;
  prevList: IPair[];
  selectedPairId?: string | number;
  messageId?: string;
}

export const pairHandler = ({
  originalData,
  currentCountry,
  cachedSettings,
  prevList,
  selectedPairId,
  messageId
}: BuildPairsDataArgs): IGetPairListTransformedResult => {
  const availablePairs = notRestrictedPairs(originalData, currentCountry);

  const pinnedPairsArray = convertJsonToArray(cachedSettings[SettingIds.PINNED_PAIRS]);
  let selectedId = selectedPairId;

  if (!selectedId && pinnedPairsArray.length) {
    const selectedPair = availablePairs.find((pair) => equalsIgnoreCase(pair.id, pinnedPairsArray[0]));
    if (selectedPair) selectedId = pinnedPairsArray[0];
  }

  const selectedMarket = new URLSearchParams(window.location.search).get('selectedMarket');
  if (selectedMarket) {
    const selectedPair = availablePairs.find((pair) => equalsIgnoreCase(pair.pair_key, selectedMarket));
    if (selectedPair) selectedId = selectedPair.id;
  }

  const pairsData = originalData.map((el) => {
    const buildEl = buildPair(el, { minFee: cachedSettings.minFee });
    const oldPair = prevList.find((p: IPair) => equalsIgnoreCase(p.pair_key, el.pair_key));
    return oldPair ? { ...oldPair, ...buildEl } : buildEl;
  });

  const isMFT = originalData.some(
    (el) => el.pairSettings[PairSettingsIds.MFT_AUDIO_LINK] || el.pairSettings[PairSettingsIds.MFT_TITLE],
  );

  return { listOfPairs: pairsData, mftCached: isMFT, lastUpdateId: messageId };
};