import { ISettingsState, SettingsInit } from "@ultrade/ultrade-js-sdk";
import { buildSettings } from "../helpers";

export const settingsHandler = (data: SettingsInit): ISettingsState => {
  return  { ...buildSettings(data), unprocessedSettings: data }
};