import ApiRequest from "@/services/ApiRequest";
import type ApiResponse from "@/services/ApiResponse";
import type ApiError from "@/services/ApiError";

class UserService {
  private BASE = "/users";

  async getMe<T>(): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/me`).getRequest<T>();
  }
}

export default new UserService();
