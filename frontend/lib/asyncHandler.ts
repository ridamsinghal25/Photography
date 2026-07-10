import { getAxiosErrorMessage } from "@/lib/getErrorMessage";
import ApiError from "@/services/ApiError";
import ApiResponse from "@/services/ApiResponse";
import type { AxiosResponse } from "axios";
import toast from "react-hot-toast";
import type { ErrorResponse, Response } from "@/types/response";

export const asyncHandler = <T>(
  func: () => Promise<AxiosResponse<Response<T>>>
): Promise<ApiResponse<T> | ApiError> => {
  return Promise.resolve(func())
    .then((data: AxiosResponse<Response<T>>) => {
      const r = data?.data;
      return new ApiResponse<T>(r.statusCode, r.data, r.message, r.success);
    })
    .catch((error: unknown) => {
      const axiosError = error as { response?: { data?: unknown } };
      const errorMessage = getAxiosErrorMessage(error);

      if (typeof window !== "undefined") {
        toast.error(errorMessage);
      }

      return new ApiError(
        errorMessage,
        axiosError,
        axiosError?.response?.data as ErrorResponse | undefined,
      );
    });
};
