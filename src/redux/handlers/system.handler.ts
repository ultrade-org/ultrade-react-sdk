import { IPendingTxn, ISocialSettings } from "@ultrade/ultrade-js-sdk";

import { ISystemMaintenanceState, ISystemVersionState } from "@interface"
import { equalsIgnoreCase } from "@redux";

export const systemVersionHandler = (fetchedVersion: string, packageVersion: string): ISystemVersionState => {
  const isVersionChanged = !equalsIgnoreCase(fetchedVersion, packageVersion);
  return { new_version: isVersionChanged };
}

export const systemMaintenanceHandler = ({ maintenance_mode, scheduledDate }: ISystemMaintenanceState): ISystemMaintenanceState => {
  return {
    maintenance_mode,
    scheduledDate
  }
}

export const socialSettingsHandler = (data: ISocialSettings, prevResult?: ISocialSettings): ISocialSettings => {
  return prevResult ? {
    ...prevResult,
    ...data
  } : data;
}