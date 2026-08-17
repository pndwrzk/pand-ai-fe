export interface ChatHistoryItem {
  id: string
  title: string
  created_at?: string
  updated_at?: string
}

export interface ChatHistoryApiResponse {
  message?: string
  data?: ChatHistoryItem[]
  meta?: {
    page?: number
    per_page?: number
    total_data?: number
  }
}
