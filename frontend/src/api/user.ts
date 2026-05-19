import api from './axios'
import type { ApiResponse, FileUploadResponse, UserDocumentResponse, UserResponse } from '@/types'

export const userApi = {
  getMyInfo: () => api.get<ApiResponse<UserResponse>>('/users/my-info'),

  updateProfile: (data: {
    fullName?: string
    phoneNumber?: string
    cccdNumber?: string
    dateOfBirth?: string
    gender?: string
    permanentAddress?: string
    province?: string
    district?: string
    ward?: string
    currentAddress?: string
    occupation?: string
    incomePerMonth?: number
    householdSize?: number
    priorityCategory?: string
  }) => api.put<ApiResponse<UserResponse>>('/users/my-info', data),

  submitKyc: (data: {
    fullName: string
    dateOfBirth?: string
    gender?: string
    cccdNumber: string
    permanentAddress?: string
    province?: string
    district?: string
    ward?: string
    occupation?: string
    incomePerMonth?: number
    householdSize?: number
    priorityCategory?: string
    cccdFrontUrl: string
    cccdBackUrl: string
    portraitUrl: string
  }) => api.post<ApiResponse<UserResponse>>('/users/kyc', data),

  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApiResponse<FileUploadResponse>>('/users/uploads', formData)
  },

  getDocuments: () => api.get<ApiResponse<UserDocumentResponse[]>>('/users/documents'),

  uploadDocument: (documentType: string, file: File) => {
    const formData = new FormData()
    formData.append('documentType', documentType)
    formData.append('file', file)
    return api.post<ApiResponse<UserDocumentResponse>>('/users/documents', formData)
  },

  submitDocuments: () => api.post<ApiResponse<boolean>>('/users/documents/submit'),
}
