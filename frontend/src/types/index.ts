export interface ApiResponse<T> {
  code: number
  message?: string
  result?: T
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  userId: string
  fullName: string
  email: string
  role: string
  isVerified: boolean
  kycStatus: string
}

export interface UserResponse {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  cccdNumber?: string
  dateOfBirth?: string
  gender?: string
  province?: string
  district?: string
  ward?: string
  currentAddress?: string
  permanentAddress?: string
  occupation?: string
  incomePerMonth?: number
  householdSize?: number
  priorityCategory?: string
  cccdFrontUrl?: string
  cccdBackUrl?: string
  portraitUrl?: string
  role: string
  isVerified: boolean
  kycStatus: string
  createdAt: string
}

export interface FileUploadResponse {
  url: string
  fileName: string
}

export interface UserDocumentResponse {
  id: string
  documentType: string
  fileUrl: string
  fileName?: string
  status: string
  uploadedAt: string
}

export interface ProjectResponse {
  id: string
  name: string
  description?: string
  location?: string
  province?: string
  totalUnits: number
  availableUnits: number
  pricePerSqm?: number
  minArea?: number
  maxArea?: number
  registrationStart?: string
  registrationEnd?: string
  lotteryDate?: string
  status: string
  imageUrl?: string
  daysRemaining?: number
}

export interface ApplicationDocumentResponse {
  id: string
  documentType: string
  fileUrl: string
  fileName?: string
  status: string
  uploadedAt: string
}

export interface ApplicationResponse {
  id: string
  userId: string
  projectId: string
  projectName?: string
  status: string
  priorityScore: number
  lotteryNumber?: string
  province?: string
  district?: string
  ward?: string
  detailedAddress?: string
  householdSize?: number
  priorityCategory?: string
  incomePerMonth?: number
  taxCode?: string
  lotteryResult?: string
  submittedAt?: string
  createdAt?: string
  documents?: ApplicationDocumentResponse[]
}

export interface NotificationResponse {
  id: string
  title: string
  content?: string
  type?: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalApplications: number
  approvedCount: number
  pendingCount: number
}

export interface DashboardResponse {
  currentApplication?: ApplicationResponse
  recentNotifications: NotificationResponse[]
  stats: DashboardStats
}

export interface Province {
  code: number
  name: string
}

export interface District {
  code: number
  name: string
  districts?: District[]
}

export interface Ward {
  code: number
  name: string
  wards?: Ward[]
}
