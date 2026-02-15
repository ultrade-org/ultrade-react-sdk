if(!process.env?.REACT_APP_API_URL){
  throw new Error('REACT_APP_API_URL is not set');
}

export const API_HOST = process.env.REACT_APP_API_URL;

export * from './redux';

export { trustWalletChains } from './common';
