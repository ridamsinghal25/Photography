import ApiRequest from "@/services/ApiRequest";
import type ApiResponse from "@/services/ApiResponse";
import type ApiError from "@/services/ApiError";

class PhotoService {
  private BASE = "/photos";

  async getPhotos<T>(userId: string, page = 1, limit = 20): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${userId}`).getRequest<T>({ page, limit });
  }

  async getPhotoById<T>(id: string): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/photo/${id}`).getRequest<T>();
  }

  async getPhotoBySlug<T>(slug: string): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/photo/slug/${slug}`).getRequest<T>();
  }

  async createPhoto<T>(body: {
    storedFileName: string;
    originalFileName: string;
    originalUrl: string;
    mimeType: string;
    fileSize: number;
    // categoryId: string;
    // tags?: string[];
    [key: string]: unknown;
  }): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(this.BASE).postRequest<T>(body);
  }

  async updatePhotoMetadata<T>(
    id: string,
    body: { /* categoryId?: string; tags?: string[]; */ [key: string]: unknown },
  ): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${id}/metadata`).patchRequest<T>(body);
  }

  async updatePhotoMedia<T>(
    id: string,
    body: {
      storedFileName: string;
      originalFileName: string;
      originalUrl: string;
      mimeType: string;
      fileSize: number;
    },
  ): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${id}/media`).patchRequest<T>(body);
  }

  async deletePhoto<T>(id: string): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${id}`).deleteRequest<T>(undefined);
  }
}

export default new PhotoService();
