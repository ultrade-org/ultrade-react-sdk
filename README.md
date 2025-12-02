# @ultrade/react-sdk

Redux Toolkit Query adaptor for @ultrade/ultrade-js-sdk. Provides RTK Query endpoints for all SDK methods.

**Repository:** [https://github.com/ultrade-org/ultrade-react-sdk](https://github.com/ultrade-org/ultrade-react-sdk)

## Package Info

- **Name:** `@ultrade/react-sdk`
- **Purpose:** Bridge between Redux Toolkit Query and Ultrade SDK
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

## TypeScript Configuration

For proper type resolution and convenient development, you need to configure your `tsconfig.json` correctly.

### Recommended Configuration

The configuration should be able to resolve types that account for the `exports` field in `package.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "nodenext"
    // Alternative options: "node16" or "bundler"
  }
}
```

### Alternative: Manual Path Configuration

If you cannot change your TypeScript settings, you can explicitly specify paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@ultrade/shared/browser/*": ["../shared/dist/browser/*"]
    }
  }
}
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

## Usage Example

```typescript
import { marketsPairsApi, walletApi } from '@ultrade/react-sdk';

// Use in React component
function TradingComponent() {
  const { data: pairs } = marketsPairsApi.useGetPairListQuery({ companyId: 1 });
  const { data: transactions } = walletApi.useGetWalletTransactionsQuery({ 
    type: 'DEPOSIT',
    page: 1,
    limit: 50
  });

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

## Build Commands

**Important:** First install node_modules from monorepo root (npm_packages)

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode

## Key Features

1. **Type-Safe RTK Query Endpoints** - All endpoints use SDK argument interfaces
2. **Cache Management** - Automatic cache invalidation with tags
3. **WebSocket Integration** - Real-time updates through WebSocket handlers
4. **Error Handling** - Centralized error handling with `withErrorHandling`
5. **SDK Client Singleton** - Single SDK client instance via `getSdkClient()`

## Cache Tags

All endpoints use cache tags for automatic invalidation:

- `markets_balances` - Balance data
- `markets_settings` - Market settings
- `markets_depth` - Order book depth
- `markets_history` - Historical candles
- `markets_orders` - User orders
- `markets_pair_list` - Trading pairs
- `markets_last_trades` - Recent trades
- `wallet_transactions` - Wallet transactions
- `wallet_transfers` - Transfer history
- `wallet_whitelist` - Withdrawal whitelist
- `wallet_trading_keys` - Trading keys
- `wallet_pending_transactions` - Pending transactions
- `withdrawal_wallets` - Withdrawal wallets

## Dependencies

- **Peer Dependencies:**
  - `@reduxjs/toolkit`
  - `react-redux`
  - `@ultrade/ultrade-js-sdk`
  - `@ultrade/shared`
