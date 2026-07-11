import ApiRequest from "@/services/ApiRequest";
import type ApiResponse from "@/services/ApiResponse";
import type ApiError from "@/services/ApiError";
import type { SubjectCreateInput, SubjectFields } from "@/types/subject";

class SubjectService {
  private BASE = "/subjects";

  async getSubjects<T>(): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(this.BASE).getRequest<T>();
  }

  async getSubjectById<T>(id: string): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${id}`).getRequest<T>();
  }

  async createSubject<T>(body: SubjectCreateInput): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(this.BASE).postRequest<T>(body);
  }

  async updateSubject<T>(id: string, body: SubjectFields): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${id}`).patchRequest<T>(body);
  }

  async deleteSubject<T>(id: string): Promise<ApiResponse<T> | ApiError> {
    return new ApiRequest(`${this.BASE}/${id}`).deleteRequest<T>(undefined);
  }
}

export default new SubjectService();
