// import { useCallback, useEffect, useMemo } from 'react';
// import { useDispatch, useStore } from 'react-redux';
// import { STREAMS } from '@ultrade/ultrade-js-sdk';
// import { SubscribeOptions } from '@ultrade/ultrade-js-sdk';
// import { getSdkClient } from '../utils';
// import { 
//   handleCodexBalances,
//   handleAllStat,
//   handleSettingsUpdate,
//   handleDepthUpdate,
// } from '../utils/websocketHandlers';

// export interface UseRtkWebSocketConfig {
//   /**
//    * Wallet address for subscription
//    */
//   walletAddress?: string;
  
//   /**
//    * Company ID
//    */
//   companyId?: number;
  
//   /**
//    * Trading pair key (e.g., 'ALGO_USDC')
//    */
//   pairKey?: string;
  
//   /**
//    * Selected pair object (for depth calculation)
//    * Pass from parent to avoid useSelector re-renders
//    */
//   selectedPair?: { pair_key: string; base_decimal: number };
// }

// /**
//  * Universal hook for managing RTK WebSocket subscriptions
//  * 
//  * IMPORTANT: This hook should be used ONLY ONCE during app initialization
//  * (e.g., in the root component App.tsx or layout component)
//  * 
//  * The hook automatically:
//  * - Subscribes to all necessary WebSocket streams
//  * - Handles events and updates RTK Query cache
//  * - Resubscribes when parameters change (address, pair, company)
//  * - Unsubscribes on component unmount
//  * 
//  * Implementation is identical to frontend/src/hooks/useSocket.tsx
//  * 
//  * @example
//  * ```tsx
//  * // App.tsx или Root Component
//  * import { useRtkWebSocket } from 'rtk-sdk-adaptor';
//  * 
//  * function App() {
//  *   const mainWalletAddress = useAppSelector((state) => state.user.mainAddress);
//  *   const companyId = useAppSelector((state) => state.settings.companyId);
//  *   const selectedPair = useAppSelector((state) => state.user.selectedPair);
//  *   const listOfPairs = useAppSelector((state) => state.exchange.listOfPairs);
//  *   
//  *   // Initialize WebSocket - once for the entire app
//  *   useRtkWebSocket({
//  *     walletAddress: mainWalletAddress,
//  *     companyId,
//  *     pairKey: selectedPair?.pair_key,
//  *     selectedPair,
//  *     listOfPairs,
//  *   });
//  *   
//  *   return <YourApp />;
//  * }
//  * 
//  * // In any child component
//  * function BalanceComponent() {
//  *   const { data: balances } = useGetBalancesQuery();
//  *   // Balances will be automatically updated via WebSocket
//  *   return <div>{JSON.stringify(balances)}</div>;
//  * }
//  * ```
//  */
// export function useRtkWebSocket({
//   walletAddress,
//   companyId,
//   pairKey = '',
//   selectedPair,
// }: UseRtkWebSocketConfig) {
//   const dispatch = useDispatch();
//   const store = useStore();

//   const selectedPairMemo = useMemo(() => selectedPair, [selectedPair]);

//   const handleSocketEvents = useCallback((event: string, args: unknown[]) => {
//     switch (event) {
//       case 'depth': {
//         // Orderbook update - frontend equivalent: dispatch(updateOrderBook(data))
//         if (args && Array.isArray(args)) {
//           const [data] = args as any;
//           handleDepthUpdate(dispatch, data, selectedPairMemo);
//         }
//         break;
//       }

//       case 'allStat': {
//         // frontend equivalent: dispatch(saveListOfPairs(result, selectedPairId))
//         // CRITICAL: Filters pairs by country (notRestrictedPairs)
//         if (args && Array.isArray(args)) {
//           const [pairStats] = args as any[];
//           const currentCountry = store.getState()?.settings?.currentCountry;
//           handleAllStat(dispatch, store, pairStats, currentCountry, companyId);
//         }
//         break;
//       }

//       case 'codexBalances': {
//         // Balance update - main event
//         // Frontend equivalent: dispatch(saveExchangeAssets(balance)) + dispatch(saveDepositBalance([balance]))
//         if (args && Array.isArray(args)) {
//           const balanceEvent = args[0] as any;
//           handleCodexBalances(dispatch, balanceEvent);
//         }
//         break;
//       }

//       case 'settingsUpdate': {
//         // Settings update - frontend equivalent: dispatch(saveSettings(settings))
//         if (args && Array.isArray(args)) {
//           const settingsEvent = args[0] as any;
//           handleSettingsUpdate(dispatch, settingsEvent);
//         }
//         break;
//       }

//       default:
//         break;
//     }
//   }, [dispatch, store]);

//   useEffect(() => {
//     if (!walletAddress) {
//       return;
//     }

//     let handlerId: number | null = null;

//     try {

//       const rtkClient = getSdkClient();

//       const finalStreams: STREAMS[] = [
//         STREAMS.SETTINGS_UPDATE,      // Settings updates
//         STREAMS.CODEX_BALANCES,      // Balances (MAIN)
//         STREAMS.DEPTH,               // Orderbook
//         STREAMS.ALL_STAT,            // Pairs statistics
//       ];

//       const subscribeOptions: SubscribeOptions = {
//         symbol: pairKey,
//         streams: finalStreams,
//         options: {
//           address: walletAddress,
//           companyId,
//         }
//       };

//       handlerId = rtkClient.subscribe(subscribeOptions, handleSocketEvents);

//     } catch (error) {
//       console.error('[RTK WebSocket] Subscription error:', error);
//     }

//     return () => {
//       if (handlerId !== null) {
//         try {
//           const rtkClient = getSdkClient();
//           rtkClient.unsubscribe(handlerId);
//         } catch (error) {
//           console.error('[RTK WebSocket] Unsubscribe error:', error);
//         }
//       }
//     };
//   }, [walletAddress, companyId, pairKey, handleSocketEvents]);
// }
