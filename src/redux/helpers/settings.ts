import { ISettingsState, SettingIds, SettingsInit } from "@ultrade/ultrade-js-sdk";
import { BOOLEAN_SETTINGS, JSON_ARRAY_SETTINGS } from "@ultrade/shared/browser/constants";

import { convertJsonToArray } from "./formaters";
import { adjustFee, convertSettingToBoolean } from "./formaters";
import { ThemeObj } from "@ultrade/shared/browser/types";

export const buildSettings = (data: SettingsInit): ISettingsState  => {
  const settings = Object.entries(data).reduce((acc, [key, value]) => {
    let settingIdArray = (key).split(".");
    const id = (settingIdArray.length === 2) ? settingIdArray[1] : settingIdArray[0];

    if (BOOLEAN_SETTINGS.some(el => el === id)) {
      acc[id] = convertSettingToBoolean(value);

    } else if (JSON_ARRAY_SETTINGS.some(el => el === id)) {
      acc[id] = convertJsonToArray(value);

    } else if (id === "logo" || id === "themes") {
      if (acc.theme1) return acc;
      let logos = null;
      let themes = null;

      if (id === "logo") {
        logos = convertJsonToArray(value);
        const otherSetting = data[SettingIds.THEMES];
        if (otherSetting) themes = convertJsonToArray(otherSetting);
      } else {
        themes = convertJsonToArray(value);
        const otherSetting = data[SettingIds.LOGO];
        if (otherSetting) logos = convertJsonToArray(otherSetting);
      }

      const allThemes = Object.entries(themes).reduce((acc, [themeId, themeValue]) => {
        acc[themeId] = {
          ...(themeValue as ThemeObj),
          logo: logos[themeId].value
        }
        return acc;
      }, {});
      acc = { ...acc, ...allThemes };

    } else if (["makerFee", "takerFee", "minFee"].includes(id)) {
      acc[id] = Number(value);
    } else {
      acc[id] = value;
    } 
    return acc;
  }, {} as ISettingsState);

  return {
    ...settings,
    makerFee: adjustFee(settings.makerFee, settings.minFee),
    takerFee: adjustFee(settings.takerFee, settings.minFee),
  }
}