import { Client } from '@ultrade/ultrade-js-sdk';
import { AuthCredentials, ClientOptions } from '@ultrade/ultrade-js-sdk';

import { setSdkClient } from '@utils';
import { withdrawalWalletsApi, systemApi, walletApi, marketsApi } from '@api';

export default class RtkSdkAdaptor extends Client {
  public pairKey: string;

  constructor(options: ClientOptions, authCredentials?: AuthCredentials) {
    super(options, authCredentials);
    setSdkClient(this);
  }

  withdrawalWallets(): typeof withdrawalWalletsApi {
    return withdrawalWalletsApi;
  }

  markets(): typeof marketsApi {
    return marketsApi;
  }
  walletApi(): typeof walletApi {
    return walletApi;
  }
  systemApi(): typeof systemApi {
    return systemApi;
  }
}
