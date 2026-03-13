import { ISettingsState, SettingsInit } from "@ultrade/ultrade-js-sdk";
import { buildSettings } from "../helpers";

export const settingsHandler = (data: SettingsInit, prevData: ISettingsState): ISettingsState => {
  return  { ...prevData, ...buildSettings(data), unprocessedSettings: data }
};