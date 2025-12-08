if(!process.env?.REACT_APP_API_URL){
  throw new Error('REACT_APP_API_URL is not set');
}

export const RTK_REDUCER_PATH = 'sdk-rtk';
export const API_HOST = process.env.REACT_APP_API_URL;

export * from './redux';
export { composedTags } from './rtkTags';