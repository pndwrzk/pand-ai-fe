export enum FileStatus {
  PENDING = 0,
  PROCESS = 1,
  COMPLETED = 2,
  FAILED = -1
}

export interface FileContent {
  id: string
  page_number: number
  content?: string
  content_original?: string
  status?: number
  created_at?: string
  updated_at?: string
}

export interface ModuleFile {
  id: string
  module_id: string
  name: string
  key: string
  url: string
  type: string
  size: number
  status: FileStatus
  total_contents?: number
  is_available_vector?: boolean
  created_at: string
  updated_at: string
  contents?: FileContent[]
}

export interface FileContentResponse {
  success: boolean
  message: string
  data: FileContent
}

export interface ModuleFilesResponse {
  message: string
  data: ModuleFile[]
}

export interface FileResponse {
  message: string
  data: ModuleFile
}

export interface PresignUploadData {
  upload_url: string
  key: string
  expires_in?: number
}

export interface PresignUploadResponse {
  message: string
  data: PresignUploadData
}

export interface FileMutationResponse {
  message: string
  data: unknown
}
