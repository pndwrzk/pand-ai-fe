export interface ModuleItem {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ModulePayload {
  name: string
  description: string | null
}

export interface ModulesResponse {
  message: string
  data: ModuleItem[]
}

export interface ModuleResponse {
  message: string
  data: ModuleItem
}
