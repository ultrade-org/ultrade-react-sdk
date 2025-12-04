interface IData<T> { data: T } 

interface IError {
  error: {
    status: number;
    data: unknown;
  };
}

export type IQueryFuncResult<T> = Promise<IData<T> | IError>;

export function dataGuard<T>(result: IData<T> | IError): result is IData<T> {
  return 'data' in result;
}
