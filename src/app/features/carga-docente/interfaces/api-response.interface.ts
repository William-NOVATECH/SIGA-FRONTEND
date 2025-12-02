export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface VerificationResponse {
  canAssign: boolean;
  reason?: string;
}