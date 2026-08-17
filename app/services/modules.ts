import { useApi } from '~/composables/useApi'
import type {
  ModuleItem,
  ModulePayload,
  ModuleResponse,
  ModulesResponse
} from '~/types/modules'
import type {
  FileContent,
  FileContentResponse,
  FileMutationResponse,
  FileResponse,
  ModuleFile,
  ModuleFilesResponse,
  PresignUploadResponse
} from '~/types/files'

export const fetchModules = async (): Promise<ModuleItem[]> => {
  const api = useApi()
  const response = await api<ModulesResponse>('/internal/modules')
  return response.data
}

export const fetchModuleFiles = async (moduleId: string): Promise<ModuleFilesResponse> => {
  const api = useApi()
  return await api<ModuleFilesResponse>(`/internal/modules/${moduleId}/files`)
}

export const fetchFileDetail = async (fileId: string): Promise<ModuleFile> => {
  const api = useApi()
  const response = await api<FileResponse>(`/internal/files/${fileId}`)
  return response.data
}

export const fetchFileContent = async (contentId: string): Promise<FileContent> => {
  const api = useApi()
  const response = await api<FileContentResponse>(`/internal/files/content/${contentId}`)
  return response.data
}

export const updateFileContent = async (
  contentId: string,
  content: string
): Promise<FileMutationResponse> => {
  const api = useApi()
  return await api<FileMutationResponse>(`/internal/files/content/${contentId}`, {
    method: 'PATCH',
    body: { content }
  })
}

export const updateFileContentStatus = async (
  contentId: string,
  status: number
): Promise<FileMutationResponse> => {
  const api = useApi()
  return await api<FileMutationResponse>(`/internal/files/content/${contentId}/status`, {
    method: 'PATCH',
    body: { status }
  })
}

export const deleteModuleFile = async (moduleId: string, fileId: string): Promise<void> => {
  const api = useApi()
  await api(`/internal/modules/${moduleId}/files/${fileId}`, { method: 'DELETE' })
}

export const createModule = async (payload: ModulePayload): Promise<ModuleItem> => {
  const api = useApi()
  const response = await api<ModuleResponse>('/internal/modules', {
    method: 'POST',
    body: payload
  })
  return response.data
}

export const updateModule = async (id: string, payload: ModulePayload): Promise<ModuleItem> => {
  const api = useApi()
  const response = await api<ModuleResponse>(`/internal/modules/${id}`, {
    method: 'PUT',
    body: payload
  })
  return response.data
}

export const deleteModule = async (id: string): Promise<void> => {
  const api = useApi()
  await api(`/internal/modules/${id}`, { method: 'DELETE' })
}

export const presignUpload = async (contentType: string): Promise<PresignUploadResponse> => {
  const api = useApi()
  return await api<PresignUploadResponse>('/internal/upload/presign', {
    method: 'POST',
    body: { content_type: contentType }
  })
}

export const createModuleFile = async (moduleId: string, key: string): Promise<FileMutationResponse> => {
  const api = useApi()
  return await api<FileMutationResponse>(`/internal/modules/${moduleId}/files`, {
    method: 'POST',
    body: { key }
  })
}
