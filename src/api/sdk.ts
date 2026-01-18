import { Dispatch } from '@reduxjs/toolkit';
import { Client, AuthCredentials, ClientOptions } from '@ultrade/ultrade-js-sdk';

import { composedTags } from '@consts';
import baseApi from './base.api';

export default class RtkSdkAdaptor extends Client {

  public static originalSdk: Client | null = null;

  private static instance: RtkSdkAdaptor | null = null;

  private constructor(options: ClientOptions, authCredentials?: AuthCredentials) {
    super(options, authCredentials);
    RtkSdkAdaptor.originalSdk= this;
  }

  static create(
    options: ClientOptions,
    authCredentials?: AuthCredentials
  ): RtkSdkAdaptor {
    if (RtkSdkAdaptor.instance) {
      throw new Error(
        'RtkSdkAdaptor instance already created. Use RtkSdkAdaptor.getInstance() to get the existing instance.'
      );
    }
    RtkSdkAdaptor.instance = new RtkSdkAdaptor(options, authCredentials);
    return RtkSdkAdaptor.instance;
  }

  static getInstance(): RtkSdkAdaptor {
    if (!RtkSdkAdaptor.instance) {
      throw new Error(
        'RtkSdkAdaptor not initialized. Call RtkSdkAdaptor.create() first.'
      );
    }
    return RtkSdkAdaptor.instance;
  }
  static resetSdkState(dispatch: Dispatch): void {
    // const tagsToInvalidate = composedTags.filter(tag => tag !== 'markets_pair_list' && tag !== 'markets_last_trades');
    dispatch(baseApi.util.invalidateTags([...composedTags]));
  }
}