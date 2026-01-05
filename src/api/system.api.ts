import {
  STREAMS,
  ISocialSettings,
  UserNotification,
  UpdateUserNotificationDto,
} from "@ultrade/ultrade-js-sdk";
import { NotificationStatusEnum } from "@ultrade/shared/browser/enums";
import { Notification } from "@ultrade/shared/browser/types";

import baseApi from "./base.api";
import { IQueryFuncResult, dataGuard } from "@utils";
import RtkSdkAdaptor from "./sdk";
import { withErrorHandling } from '@helpers';
import { IMaintenanceSocketData, ISystemMaintenanceState, ISystemNotificationsState, ISystemVersionState } from "@interface";
import { socialSettingsHandler, systemMaintenanceHandler, systemVersionHandler } from "@redux";
import { initialSocialSettingsState, initialSystemMaintenanceState, initialSystemNotificationsState, initialSystemVersionState } from "@consts";

interface IGetSystemVersionArgs {
  packageVersion: string;
}

export const systemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getVersion: builder.query<ISystemVersionState, IGetSystemVersionArgs>({
      keepUnusedDataFor: Number.POSITIVE_INFINITY,
      queryFn: async ({ packageVersion }: IGetSystemVersionArgs): IQueryFuncResult<ISystemVersionState> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getVersion());

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
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.SYSTEM], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [string, string]) => {
            
            if(event !== "version"){
              return;
            }

            if (!args || !args.length) {
              return;
            }

            const [version] = args;

            updateCachedData((draft) => {
              if(!draft) {
                return initialSystemVersionState;
              }
              const preparedState = systemVersionHandler(version, packageVersion);
              draft.new_version = preparedState.new_version;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
    getMaintenance: builder.query<ISystemMaintenanceState, void>({
      keepUnusedDataFor: Number.POSITIVE_INFINITY,
      queryFn: async (): IQueryFuncResult<ISystemMaintenanceState> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getMaintenance());

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
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.SYSTEM], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [IMaintenanceSocketData, string]) => {
          
            if(event !== "maintenance"){
              return;
            }
            
            if (!args || !args.length) {
              return;
            }
        
            const [socketData] = args;

            updateCachedData((draft) => {
              if(!draft) {
                return initialSystemMaintenanceState;
              }
              
              const maintenanceData: ISystemMaintenanceState = {
                maintenance_mode: socketData.mode,
                scheduledDate: socketData.scheduledDate,
              };
              
              const result = systemMaintenanceHandler(maintenanceData);

              draft.maintenance_mode = result.maintenance_mode;
              draft.scheduledDate = result.scheduledDate;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
    getSocialSettings: builder.query<ISocialSettings, void>({
      merge(currentCacheData, responseData) {
        return socialSettingsHandler(responseData, currentCacheData);
      },
      queryFn: async (): IQueryFuncResult<ISocialSettings> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getSocialSettings());
      },
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.POINT_SYSTEM_SETTINGS_UPDATE], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [ISocialSettings, string]) => {
          
            if(event !== "pointSystemSettingsUpdate"){
              return;
            }
            
            if (!args || !args.length) {
              return;
            }
        
            const [data] = args;

            updateCachedData((draft) => {
              if(!draft) {
                return initialSocialSettingsState;
              }
              return socialSettingsHandler(data, draft);
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
      providesTags: ['social_settings'],
    }),
    getNotifications: builder.query<ISystemNotificationsState, void>({
      queryFn: async (): IQueryFuncResult<ISystemNotificationsState> => {
        const [notificationsResult, notificationsUnreadCountResult] = await Promise.all([withErrorHandling(() => RtkSdkAdaptor.originalSdk.getNotifications()), withErrorHandling(() => RtkSdkAdaptor.originalSdk.getNotificationsUnreadCount())]);
        
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
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.NEW_NOTIFICATION], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [Notification, string]) => {
            if (event !== "new_notification") {
              return;
            }

            if (!args || !args.length) {
              return;
            }

            const [socketData] = args;

            updateCachedData((draft) => {
              if (!draft) {
                return initialSystemNotificationsState;
              }
              
              const userNotification: UserNotification = {
                id: socketData.id ?? 0,
                globalNotificationId: socketData.globalNotificationId ?? 0,
                priority: socketData.priority,
                status: socketData.status,
                type: socketData.type,
                message: socketData.message,
                createdAt: socketData.createdAt,
              };
              
              draft.notifications = [userNotification, ...draft.notifications];
              draft.notificationsUnreadCount = draft.notificationsUnreadCount + 1;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
      providesTags: ['system_notifications'],
    }),
    readNotifications: builder.mutation<UpdateUserNotificationDto[], UpdateUserNotificationDto[]>({
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
       const updateQuery = dispatch(systemApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          if(!draft) {
            return initialSystemNotificationsState;
          }
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
        const unreadNotifications: UpdateUserNotificationDto[] = notifications
        .filter(n => n.status === NotificationStatusEnum.UNREAD)
        .map(({ id, globalNotificationId } ) => {
          return { id, globalNotificationId, status: NotificationStatusEnum.READ };
        })

        if (!unreadNotifications.length) {
          return { data: [] };
        }

        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.readNotifications(unreadNotifications));
      },
    }),
  }),
});

export const {
  useGetVersionQuery,
  useGetMaintenanceQuery,
  useGetSocialSettingsQuery,
  useGetNotificationsQuery,
  useLazyGetVersionQuery,
  useLazyGetMaintenanceQuery,
  useLazyGetSocialSettingsQuery,
  useLazyGetNotificationsQuery,
  useReadNotificationsMutation,
} = systemApi;
