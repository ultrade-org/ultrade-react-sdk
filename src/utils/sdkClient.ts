import { Client } from '@ultrade/ultrade-js-sdk';

let sdkClientInstance: Client | null = null;

export const setSdkClient = (client: Client) => {
  sdkClientInstance = client;
};

export const getSdkClient = (): Client => {
  if (!sdkClientInstance) {
    throw new Error('SDK Client not initialized');
  }
  return sdkClientInstance;
};

