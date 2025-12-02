export type IQueryFuncResult<T> = Promise<
  | {
      data: T;
    }
  | {
      error: {
        status: number;
        data: unknown;
      };
    }
>;
