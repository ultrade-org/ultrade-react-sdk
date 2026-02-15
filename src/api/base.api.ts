import { createApi } from '@reduxjs/toolkit/query/react';

import { composedTags } from '@rtkTags';

const RTK_REDUCER_PATH = 'sdk-rtk';

const baseApi = createApi({
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