# @ultrade/react-sdk

Redux Toolkit Query adaptor for @ultrade/ultrade-js-sdk. Provides RTK Query endpoints for all SDK methods.

**Repository:** [https://github.com/ultrade-org/ultrade-react-sdk](https://github.com/ultrade-org/ultrade-react-sdk)

**SDK Repository:** [https://github.com/ultrade-org/ultrade-js-sdk](https://github.com/ultrade-org/ultrade-js-sdk)

## Package Info

- **Name:** `@ultrade/react-sdk`
- **Main Entry:** `./dist/index.js`
- **Types:** `./dist/index.d.ts`

## Installation

Install the package using your preferred package manager:

```bash
npm install @ultrade/react-sdk
```

```bash
yarn add @ultrade/react-sdk
```

```bash
pnpm add @ultrade/react-sdk
```

## Structure

```
src/
├── api/                           # RTK Query API definitions
│   ├── base.api.ts                # Base API configuration
│   ├── wallet.api.ts              # Wallet endpoints
│   ├── withdrawalWallets.api.ts   # Withdrawal wallet endpoints
│   ├── markets/                   # Market-related endpoints
│   │   ├── balances.api.ts        # Balance queries
│   │   ├── common.api.ts          # Common market queries (settings)
│   │   ├── depth.api.ts           # Order book depth
│   │   ├── history.api.ts         # Historical data
│   │   ├── orders.api.ts          # Order management
│   │   ├── pairs.api.ts           # Trading pairs
│   │   ├── trades.api.ts          # Trade history
│   │   └── index.ts
│   └── index.ts
│
├── connection/                # Redux connection utilities
│   ├── middlewares.ts         # RTK Query middlewares
│   └── reducers.ts            # RTK Query reducers
│
├── consts/                    # Constants
│   ├── rtkTags.ts             # RTK Query cache tags
│   └── index.ts
│
├── hooks/                     # React hooks
│   ├── useDepositBalance.ts   # Balance deposit hook
│   ├── useRtkWebSocket.ts     # WebSocket integration hook
│   └── index.ts
│
├── interfaces/                # TypeScript interfaces
│   ├── markets.interface.ts   # Market-specific interfaces
│   └── index.ts
│
├── utils/                     # Utility functions
│   ├── createValidatedTag.ts  # Tag creation helper
│   ├── error.dto.ts           # Error handling types
│   ├── helpers.ts             # General helpers
│   ├── sdkClient.ts           # SDK client singleton
│   ├── types.ts               # Type definitions
│   ├── websocketHandlers/     # WebSocket event handlers
│   │   ├── pairHandlers.ts    # Pair update handlers
│   │   └── settingsHandlers.ts # Settings update handlers
│   └── index.ts
│
└── index.ts                   # Main entry point
```

## TypeScript Path Aliases

Defined in `tsconfig.alias.json`:

| Alias | Path | Description |
|-------|------|-------------|
| `@api/*` | `./src/api/*` | API endpoint definitions |
| `@consts` | `./src/consts/index.ts` | Constants |
| `@ultrade/shared/browser/*` | `../shared/dist/browser/*` | Shared browser utilities |
| `@interfaces` | `./src/interfaces/index.ts` | TypeScript interfaces |
| `@utils` | `./src/utils/index.ts` | Utility functions |

### Creating RTK SDK Client

```typescript
import RTKSDKAdaptor from '@ultrade/react-sdk';
import algosdk from 'algosdk';

// Create Algorand SDK client
const rtkAlgodClient = new algosdk.Algodv2(
  '', // token
  'https://testnet-api.algonode.cloud', // server
  '' // port
);

// Initialize RTK SDK client (extends Client from @ultrade/ultrade-js-sdk)
const rtkSdkClient = new RTKSDKAdaptor({
  network: 'testnet', // or 'mainnet'
  apiUrl: 'https://api.testnet.ultrade.org',
  algoSdkClient: rtkAlgodClient,
  websocketUrl: 'wss://ws.testnet.ultrade.org',
});

// Set signer (same as base SDK)
rtkSdkClient.setSigner({
  signMessage,
  signMessageByToken
});
```

### Redux Store Setup

```typescript
import { SDKReducers, SDKMiddlewares } from '@ultrade/react-sdk';

export const store = configureStore({
  reducer: {
    // ... your other reducers
    ...SDKReducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(SDKMiddlewares)
});

```

### Using RTK Query Hooks

```typescript
import { useAppSelector } from './hooks';
import { useEffect } from 'react';

function Component() {
  //...

  const { useLazyGetSettingsQuery, useLazyGetPairListQuery } = rtkSdkClient.markets();
  const { useGetTradingKeysQuery, useAddTradingKeyMutation } = rtkSdkClient.walletApi();
  
  // Lazy query for settings
  const [getSettings, { data: settings, isLoading: isLoadingSettings }] = useLazyGetSettingsQuery();
  
  // Query for trading pairs
  const [getPairList, { data: pairs, isLoading: isLoadingPairs }] = useLazyGetPairListQuery();
  
  // Query for trading keys
  const { data: tradingKeys, isLoading: isLoadingKeys } = useGetTradingKeysQuery();
  
  // Mutation for creating trading key
  const [addTradingKey, { isLoading: isCreatingKey }] = useAddTradingKeyMutation();
  
  return <></>
}
```

## Redux integration

```typescript
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  
  //component logic

  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```