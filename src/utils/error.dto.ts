export class ErrorDto {
  error: {
    status: number;
    data: unknown;
  };
  constructor(error: any) {
    this.error = {
      status: error.response?.status || 'FETCH_ERROR',
      data: error.response?.data || { 
        message: error.shortMessage || error.details || String(error),
        error: error.shortMessage || "Something went wrong",
        statusCode: error.code || 'FETCH_ERROR'
      },
    };
  }
}
