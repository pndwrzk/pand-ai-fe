export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export interface ConversationSource {
  file_key?: string
  file_name?: string
  page_number?: number
  url?: string
}

export interface StreamPayload {
  conversation_id?: string
  conversation_title?: string
  message?: string
  response?: string
  suggested_questions?: string[]
  sources?: ConversationSource[]
}

export interface StreamDeltaEvent {
  event: 'sources' | 'answer_complete' | 'suggested_questions'
  sources?: ConversationSource[]
  suggested_questions?: string[]
  response?: string
  conversation_id?: string
  conversation_title?: string
}


export interface StreamEvent {
  delta?: string | StreamDeltaEvent
  event?: string
  payload?: StreamPayload
}
export interface ConversationHistoryMessage {
  id?: string
  content?: string
  role?: number
  created_at?: string
  updated_at?: string
}

export interface ConversationHistoryData {
  id?: string
  title?: string
  messages?: ConversationHistoryMessage[]
}

export interface ConversationHistoryResponse {
  message?: string
  data?: ConversationHistoryData
}

export interface CreateConversationResponse {
  message?: string
  data?: {
    conversation_id?: string
  }
}
