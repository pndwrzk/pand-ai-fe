import type {
  ChatMessage,
  ConversationHistoryResponse,
  CreateConversationResponse,
  StreamEvent,
  StreamPayload
} from '~/types/conversation'

export const createConversation = async (message: string): Promise<string> => {
  const api = useApi()
  const response = await api<CreateConversationResponse>('/conversations', {
    method: 'POST',
    body: { message }
  })

  const conversationId = response?.data?.conversation_id

  if (!conversationId) {
    throw new Error('Conversation ID not found in response')
  }

  return conversationId
}

export const fetchConversationHistory = async (conversationId: string): Promise<ConversationHistoryResponse> => {
  const api = useApi()
  return await api<ConversationHistoryResponse>(`/conversations/${conversationId}/history`)
}

export const streamConversationReply = async (
  conversationId: string,
  message: string,
  onChunk: (event: StreamEvent) => void
): Promise<void> => {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()
  const apiBaseUrl = String(runtimeConfig.public.apiBaseUrl).replace(/\/$/, '')
  const isInternalRequest = route.path.startsWith('/dashboard')
  const token = isInternalRequest
    ? useCookie('internal_access_token').value
    : useCookie('app_access_token').value

  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'text/event-stream'
  })

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${conversationId}/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
    credentials: 'include'
  })

  if (!response.ok || !response.body) {
    throw new Error(`Chat stream request failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split(/\r?\n\r?\n/)
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const lines = chunk
        .split(/\r?\n/)
        .map(line => line.replace(/^data:\s*/, '').trim())
        .filter(Boolean)

      for (const line of lines) {
        try {
          const payload = JSON.parse(line) as StreamEvent
          onChunk(payload)
        } catch {
          // Ignore malformed stream chunks and continue reading.
        }
      }
    }
  }
}

export const normalizeConversationMessage = (item: { id?: string; content?: string; role?: number }): ChatMessage | null => {
  if (!item?.id) {
    return null
  }

  return {
    id: String(item.id),
    role: item.role === 0 ? 'user' : 'assistant',
    content: item.content || ''
  }
}

export const getPendingConversationMessage = (conversationId: string): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  const key = `pendingConversationMessage:${conversationId}`
  const pendingMessage = sessionStorage.getItem(key)

  if (pendingMessage) {
    sessionStorage.removeItem(key)
  }

  return pendingMessage ?? ''
}

export const setPendingConversationMessage = (conversationId: string, message: string): void => {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.setItem(`pendingConversationMessage:${conversationId}`, message)
}

export const buildStreamPayload = (payload: StreamEvent, conversationId: string): StreamPayload | undefined => payload.payload

export const createAssistantErrorMessage = (): string => 'Sorry, an error occurred while processing the conversation.'
