import { AnyAction } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';

import { marketsCommonApi } from '@api/markets';

/**
 * Settings update event from WebSocket
 */
export interface SettingsUpdateEvent {
  data: {
    [settingId: string]: any;
    companyId: number;
    isUltrade: boolean;
  };
}

/**
 * Handle settings update via WebSocket
 * Frontend equivalent: dispatch(saveSettings(settings))
 */
export function handleSettingsUpdate(
  dispatch: Dispatch,
  settingsEvent: SettingsUpdateEvent
) {
  const settings = settingsEvent?.data;
  
  if (!settings) {
    console.warn('[RTK Settings] Invalid settings data');
    return;
  }

  dispatch(
    // @ts-ignore
    marketsCommonApi.util.updateQueryData('getSettings', null, () => settings) as unknown as AnyAction
  );
}

