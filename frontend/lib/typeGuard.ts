import ApiError from "@/services/ApiError";
import ApiResponse from "@/services/ApiResponse";

export function isApiError(x: unknown): x is ApiError {
  return typeof x === "object" && x !== null && (x as any).error === true;
}

export function isApiResponse<T = unknown>(x: unknown): x is ApiResponse<T> {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as any).success === "boolean" &&
    typeof (x as any).statusCode === "number"
  );
}
