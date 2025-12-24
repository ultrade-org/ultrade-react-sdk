import { UserNotification } from "@ultrade/ultrade-js-sdk";
import { MaintenanceMode } from "@ultrade/shared/browser/enums";

export interface ISystemVersionState {
  new_version: boolean;
}

export interface ISystemMaintenanceState {
  maintenance_mode: MaintenanceMode,
  scheduledDate?: Date
}

export interface ISystemNotificationsState {
  notifications: UserNotification[],
  notificationsUnreadCount: number
}