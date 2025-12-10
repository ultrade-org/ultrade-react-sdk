const marketsTags = [
  'markets_balances',
  'markets_last_trades',
  'markets_symbols',
  'markets_depth',
  'markets_orders',
  'markets_settings',
  'markets_pair_list',
  'markets_history',
  'markets_codex_assets',
] as const

const walletTags = [
  'wallet_transactions',
  'wallet_trading_keys',
  'wallet_transfers',
  'wallet_pending_transactions',
  'wallet_whitelist',
] as const

const withdrawalWalletsTags = [
  'withdrawal_wallets',
] as const

export const composedTags = [
  ...marketsTags,
  ...walletTags,
  ...withdrawalWalletsTags,
] as const