import { ISocialSettings } from "@ultrade/ultrade-js-sdk";

import { ISystemMaintenanceState, ISystemNotificationsState, ISystemVersionState } from "@interface";

export const initialSystemVersionState: ISystemVersionState = {
  new_version: false,
  serverVersion: '',
}

export const initialSystemMaintenanceState: ISystemMaintenanceState = {
  maintenance_mode: 0,
  scheduledDate: null,
}

export const initialSocialSettingsState: ISocialSettings = {
  isShowUltradePoints: null,
  discordEnabled: null,
  telegramEnabled: null,
  telegramBotName: "",
  telegramBotId: "",
  telegramGroupId:  "",
  telegramGroupName:  "",
  twitterEnabled:  null,
  twitterJobEnabled:  true,
  twitterAccountId:  "",
  twitterAccountName:  "",
  guideLink: "",
}

export const initialSystemNotificationsState: ISystemNotificationsState = {
  notifications: [],
  notificationsUnreadCount: 0,
}