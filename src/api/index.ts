import { Client } from '@ultrade/ultrade-js-sdk';
import { AuthCredentials, ClientOptions } from '@ultrade/ultrade-js-sdk';

import baseApi from './base.api';
import { setSdkClient } from '@utils';
import { withdrawalWalletsApi } from '@api/withdrawalWallets.api';
import { marketsApi } from '@api/markets';
import { walletApi } from '@api/wallet.api';

export default class RtkSdkAdaptor extends Client {
  constructor(
    options: ClientOptions,
    authCredentials?: AuthCredentials
  ) {
    super(options, authCredentials);
    setSdkClient(this);
  }

  withdrawalWallets(): typeof withdrawalWalletsApi {
    return withdrawalWalletsApi
  }

  markets(): typeof marketsApi {
    return marketsApi
  }
  walletApi(): typeof walletApi {
    return walletApi
  }
}

export {
  baseApi,
}

export * from '../hooks';