import { IPendingTxn, ISocialSettings } from "@ultrade/ultrade-js-sdk";

import { ISystemMaintenanceState, ISystemVersionState } from "@interface"
import { isServerVersionNewer } from "@redux";

export const systemVersionHandler = (fetchedVersion: string, packageVersion: string): ISystemVersionState => {
  return {
    new_version: isServerVersionNewer(fetchedVersion, packageVersion),
    serverVersion: fetchedVersion
  };
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