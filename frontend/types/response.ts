export type Response<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

export type ErrorResponse = {
  statusCode: number;
  data: unknown;
  success: boolean;
  errors: unknown[];
  message: string;
};
