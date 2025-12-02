export class ErrorDto {
  error: {
    status: number;
    data: unknown;
  };
  constructor(error: any) {
    this.error = {
      status: error.response?.status,
      data: error.response?.data || error.message,
    };
  }
}
