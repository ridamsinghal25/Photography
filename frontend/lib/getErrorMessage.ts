import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/types/response";

export function getAxiosErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ErrorResponse & { message?: string }>;
  const data = axiosError?.response?.data;

  if (data && typeof data === "object" && typeof data.message === "string" && data.message) {
    return data.message;
  }

  if (axiosError?.message) {
    return axiosError.message;
  }

  return "Something went wrong";
}
