import {
  STREAMS,
  ISocialSettings,
  UserNotification,
  UpdateUserNotificationDto,
} from "@ultrade/ultrade-js-sdk";
import { NotificationStatusEnum } from "@ultrade/shared/browser/enums";

import baseApi from "./base.api";
import { IQueryFuncResult, getSdkClient, dataGuard } from "@utils";
import { withErrorHandling } from '@helpers';
import { ISystemMaintenanceState, ISystemNotificationsState, ISystemVersionState } from "@interface";
import { socialSettingsHandler, systemMaintenanceHandler, systemVersionHandler } from "@redux";
import { initialSystemNotificationsState } from "@consts";

interface IGetSystemVersionArgs {
  packageVersion: string;
}

export const systemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getVersion: builder.query<ISystemVersionState, IGetSystemVersionArgs>({
      keepUnusedDataFor: Number.POSITIVE_INFINITY,
      queryFn: async ({ packageVersion }: IGetSystemVersionArgs): IQueryFuncResult<ISystemVersionState> => {
        const client = getSdkClient();

        const originResult = await withErrorHandling(() => client.getVersion());

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const preparedState = systemVersionHandler(originResult.data.version, packageVersion);

        return { data: preparedState };
      },
      providesTags: ['system_version'],

      async onCacheEntryAdded({ packageVersion }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.SYSTEM], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [string, string]) => {
            
            if(event !== "version"){
              return;
            }

            if (!args || !args.length) {
              return;
            }

            const [version] = args;

            updateCachedData((draft) => {
              const preparedState = systemVersionHandler(version, packageVersion);
              draft.new_version = preparedState.new_version;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
    }),
    getMaintenance: builder.query<ISystemMaintenanceState, void>({
      keepUnusedDataFor: Number.POSITIVE_INFINITY,
      queryFn: async (): IQueryFuncResult<ISystemMaintenanceState> => {
        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.getMaintenance());

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const preparedResult = systemMaintenanceHandler({ maintenance_mode: originResult.data.mode, scheduledDate: originResult.data.scheduledDate });

        return { data: preparedResult };
      },
      providesTags: ['system_maintenance'],
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.SYSTEM], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ISystemMaintenanceState, string]) => {
          
            if(event !== "maintenance"){
              return;
            }
            
            if (!args || !args.length) {
              return;
            }
        
            const [data] = args;

            updateCachedData((draft) => {
              const result = systemMaintenanceHandler(data);

              draft.maintenance_mode = result.maintenance_mode;
              draft.scheduledDate = result.scheduledDate;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
    }),
    getSocialSettings: builder.query<ISocialSettings, void>({
      merge(currentCacheData, responseData) {
        return socialSettingsHandler(responseData, currentCacheData);
      },
      queryFn: async (): IQueryFuncResult<ISocialSettings> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getSocialSettings());
      },
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.POINT_SYSTEM_SETTINGS_UPDATE], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ISocialSettings, string]) => {
          
            if(event !== "pointSystemSettingsUpdate"){
              return;
            }
            
            if (!args || !args.length) {
              return;
            }
        
            const [data] = args;

            updateCachedData((draft) => socialSettingsHandler(data, draft));
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
      providesTags: ['social_settings'],
    }),
    getNotifications: builder.query<ISystemNotificationsState, void>({
      queryFn: async (): IQueryFuncResult<ISystemNotificationsState> => {
        const client = getSdkClient();
        const [notificationsResult, notificationsUnreadCountResult] = await Promise.all([withErrorHandling(() => client.getNotifications()), withErrorHandling(() => client.getNotificationsUnreadCount())]);
        
        if (!dataGuard(notificationsResult) || !dataGuard(notificationsUnreadCountResult)) {
          return { data: initialSystemNotificationsState};
        }

        const preparedState: ISystemNotificationsState = {
          notifications: notificationsResult.data,
          notificationsUnreadCount: notificationsUnreadCountResult.data.count,
        }

        return { data: preparedState} 
      },
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.NEW_NOTIFICATION], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [UserNotification, string]) => {
            if(event !== "new_notification"){
              return;
            }

            if (!args || !args.length) {
              return;
            }

            const [data] = args;

            updateCachedData((draft) => {
              draft.notifications = [data, ...draft.notifications];
              draft.notificationsUnreadCount = draft.notificationsUnreadCount + 1;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
      providesTags: ['system_notifications'],
    }),
    readNotifications: builder.mutation<UpdateUserNotificationDto[], UpdateUserNotificationDto[]>({
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
       const updateQuery = dispatch(systemApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          const allNotificationsRead = draft.notifications.map(e => { 
            return { ...e, status: NotificationStatusEnum.READ }
          });

          draft.notifications = allNotificationsRead;
          draft.notificationsUnreadCount = 0;
        }));
        try {
          await queryFulfilled;
        } catch (error) {
          updateQuery.undo();
        }
      },
      queryFn: async (notifications: UserNotification[]): IQueryFuncResult<UpdateUserNotificationDto[]> => {
        const client = getSdkClient();
        const unreadNotifications: UpdateUserNotificationDto[] = notifications
        .filter(n => n.status === NotificationStatusEnum.UNREAD)
        .map(({ id, globalNotificationId } ) => {
          return { id, globalNotificationId, status: NotificationStatusEnum.READ };
        })

        if (!unreadNotifications.length) {
          return { data: [] };
        }

        return await withErrorHandling(() => client.readNotifications(unreadNotifications));
      },
    }),
  }),
});
