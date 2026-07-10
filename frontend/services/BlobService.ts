import ApiRequest from "@/services/ApiRequest";
import type ApiResponse from "@/services/ApiResponse";
import type ApiError from "@/services/ApiError";

class BlobService {
  private BASE = "/blob";

  async getUploadSasUrl<T>(mimeType: string): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/sas-url`).postRequest<T>({ mimeType });
  }
}

export default new BlobService();
