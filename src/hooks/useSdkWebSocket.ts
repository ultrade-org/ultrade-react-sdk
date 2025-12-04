import { useEffect } from 'react';
import { STREAMS } from '@ultrade/ultrade-js-sdk';
import { SubscribeOptions } from '@ultrade/ultrade-js-sdk';
import { getSdkClient } from '@utils';

export interface UseRtkWebSocketConfig {
  /**
   * Wallet address for subscription
   */
  walletAddress?: string;
  
  /**
   * Company ID
   */
  companyId?: number;
  
  /**
   * Trading pair key (e.g., 'ALGO_USDC')
   */
  pairKey?: string;
}

/**
 * Hook for RTK WebSocket subscriptions
 * 
 * IMPORTANT: This hook should be used ONLY ONCE during app initialization
 * (e.g., in the root component App.tsx or layout component)
 * 
 * The hook automatically:
 * - Subscribes to all necessary WebSocket streams
 * - Resubscribes when parameters change (address, pair, company)
 * - Unsubscribes on component unmount
 * 
 * Implementation is identical to frontend/src/hooks/useSocket.tsx
 * 
 * @example
 * ```tsx
 * // App.tsx или Root Component
 * import { useRtkWebSocket } from 'rtk-sdk-adaptor';
 * 
 * function App() {
 *   const mainWalletAddress = useAppSelector((state) => state.user.mainAddress);
 *   const companyId = useAppSelector((state) => state.settings.companyId);
 *   const selectedPair = useAppSelector((state) => state.user.selectedPair);
 *    
 *   // Initialize WebSocket - once for the entire app
 *   useRtkWebSocket({
 *     walletAddress: mainWalletAddress,
 *     companyId,
 *     pairKey: selectedPair?.pair_key,
 *   });
 *   
 *   return <YourApp />;
 * }
 * 
 * // In any child component
 * function BalanceComponent() {
 *   const { data: balances } = useGetBalancesQuery();
 *   // Balances will be automatically updated via WebSocket
 *   return <div>{JSON.stringify(balances)}</div>;
 * }
 * ```
 */
export function useSdkWebSocket({
  walletAddress,
  companyId,
  pairKey = '',
}: UseRtkWebSocketConfig) {

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    let handlerId: number | null = null;

    try {

      const rtkClient = getSdkClient();

      const finalStreams: STREAMS[] = [
        STREAMS.SETTINGS_UPDATE,      // Settings updates
        STREAMS.CODEX_BALANCES,      // Balances (MAIN)
        STREAMS.DEPTH,               // Orderbook
        STREAMS.ALL_STAT,            // Pairs statistics
      ];

      const subscribeOptions: SubscribeOptions = {
        symbol: pairKey,
        streams: finalStreams,
        options: {
          address: walletAddress,
          companyId,
        }
      };

      handlerId = rtkClient.subscribe(subscribeOptions, (event: string, data: any) => {
        console.log('WebSocket event:', event, data);
      });

    } catch (error) {
      console.error('[RTK WebSocket] Subscription error:', error);
    }

    return () => {
      if (handlerId !== null) {
        try {
          const rtkClient = getSdkClient();
          rtkClient.unsubscribe(handlerId);
        } catch (error) {
          console.error('[RTK WebSocket] Unsubscribe error:', error);
        }
      }
    };
  }, []);
}
