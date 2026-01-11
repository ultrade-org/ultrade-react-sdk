import { createApi } from '@reduxjs/toolkit/query/react';

import { composedTags, RTK_REDUCER_PATH } from '@consts';

export const baseApi = createApi({
  reducerPath: RTK_REDUCER_PATH,
  baseQuery: () => {
    return {
      data: null,
    };
  },
  tagTypes: composedTags,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

export default baseApi;