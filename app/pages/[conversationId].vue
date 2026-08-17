<script setup lang="ts">
import { z } from 'zod'
import type { ChatMessage, ConversationSource, StreamEvent } from '~/types/conversation'
import {
    buildStreamPayload,
    createAssistantErrorMessage,
    fetchConversationHistory,
    getPendingConversationMessage,
    normalizeConversationMessage,
    streamConversationReply
} from '~/services/conversation'
import { useErrorHandler } from '~/composables/useErrorHandler'

const messageSchema = z.object({
    message: z.string().trim().min(1, 'Please enter a message.')
})

const route = useRoute()

const conversationId = computed(() => String(route.params.conversationId ?? ''))
const conversationTitle = ref('')

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isLoading = ref(false)
const isHistoryLoading = ref(false)
const inputError = ref('')
const suggestedQuestions = ref<string[]>([])
const sources = ref<ConversationSource[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const isPdfModalOpen = ref(false)
const selectedSource = ref<ConversationSource | null>(null)
const { upsertConversation } = useChatHistory()
const { open: openSidebar } = useSidebar()
const { handleError } = useErrorHandler()

const loadConversationHistory = async () => {
    if (!conversationId.value) {
        return
    }

    isHistoryLoading.value = true

    try {
        const response = await fetchConversationHistory(conversationId.value)
        const historyData = response?.data

        if (!historyData) {
            return
        }

        if (historyData.title) {
            conversationTitle.value = historyData.title
            upsertConversation(conversationId.value, historyData.title)
        }

        const historyMessages = Array.isArray(historyData.messages) ? historyData.messages : []

        messages.value = historyMessages
            .map(normalizeConversationMessage)
            .filter((item): item is ChatMessage => Boolean(item))

        await nextTick()
        await scrollToBottom()
    } catch (error) {
        console.error('Failed to load conversation history:', error)
        handleError(error)
    } finally {
        isHistoryLoading.value = false
    }
}

const scrollToBottom = async () => {
    await nextTick()

    messagesContainer.value?.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth'
    })
}

const appendMessage = (message: ChatMessage) => {
    messages.value = [...messages.value, message]
}

const streamConversation = async (message: string) => {
    const trimmedMessage = message.trim()

    if (!conversationId.value || !trimmedMessage || isLoading.value) {
        return
    }

    const userMessageId = crypto.randomUUID()
    const assistantMessageId = crypto.randomUUID()

    appendMessage({
        id: userMessageId,
        role: 'user',
        content: trimmedMessage
    })

    appendMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: ''
    })

    isLoading.value = true

    await scrollToBottom()

    try {
        await streamConversationReply(conversationId.value, trimmedMessage, (payload: StreamEvent) => {
            // 1. Potongan teks jawaban
            if (typeof payload.delta === 'string') {
                const assistantMessage = messages.value.find(m => m.id === assistantMessageId)
                if (assistantMessage) {
                    assistantMessage.content += payload.delta
                }
                return
            }

            // 2. Event terstruktur (sources / answer_complete / suggested_questions)
            if (payload.delta && typeof payload.delta === 'object') {
                const deltaEvent = payload.delta

                if (deltaEvent.event === 'sources') {
                    if (Array.isArray(deltaEvent.sources)) {
                        sources.value = deltaEvent.sources.filter(s => s?.file_name)
                    }
                    return
                }

                if (deltaEvent.event === 'answer_complete') {
                    const assistantMessage = messages.value.find(m => m.id === assistantMessageId)
                    if (assistantMessage && deltaEvent.response) {
                        assistantMessage.content = deltaEvent.response
                    }

                    if (deltaEvent.conversation_title) {
                        conversationTitle.value = deltaEvent.conversation_title
                        upsertConversation(
                            deltaEvent.conversation_id || conversationId.value,
                            deltaEvent.conversation_title
                        )
                    }

                    isLoading.value = false
                    return
                }

                if (deltaEvent.event === 'suggested_questions') {
                    if (Array.isArray(deltaEvent.suggested_questions) && deltaEvent.suggested_questions.length > 0) {
                        suggestedQuestions.value = deltaEvent.suggested_questions
                    }
                    return
                }
            }

            // 3. Fallback final ("done") — jaga-jaga ada yang kelewat
            if (payload.event === 'done') {
                const donePayload = buildStreamPayload(payload, conversationId.value)
                if (!donePayload) return

                const assistantMessage = messages.value.find(m => m.id === assistantMessageId)
                if (assistantMessage && donePayload.response) {
                    assistantMessage.content = donePayload.response
                }

                if (Array.isArray(donePayload.sources) && donePayload.sources.length > 0) {
                    sources.value = donePayload.sources.filter((source) => source?.file_name)
                }

                if (Array.isArray(donePayload.suggested_questions) && donePayload.suggested_questions.length > 0) {
                    suggestedQuestions.value = donePayload.suggested_questions
                }

                if (donePayload.conversation_title) {
                    conversationTitle.value = donePayload.conversation_title
                    upsertConversation(
                        donePayload.conversation_id || conversationId.value,
                        donePayload.conversation_title
                    )
                }
            }
        })
    } catch (error) {
        console.error('Failed to stream conversation:', error)

        const assistantMessage = messages.value.find(messageItem => messageItem.id === assistantMessageId)

        if (assistantMessage) {
            assistantMessage.content = createAssistantErrorMessage()
        }

        handleError(error)
    } finally {
        isLoading.value = false
        await scrollToBottom()
    }
}

const validateInputMessage = (value: string) => {
    const result = messageSchema.safeParse({ message: value })
    inputError.value = result.success ? '' : result.error.flatten().fieldErrors.message?.[0] ?? ''
    return result.success
}

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()

        const content = input.value.trim()

        if (!isLoading.value && validateInputMessage(content)) {
            input.value = ''
            void streamConversation(content)
        }
    }
}

const handleSend = async () => {
    const trimmedMessage = input.value.trim()

    if (isLoading.value || !validateInputMessage(trimmedMessage)) {
        return
    }

    suggestedQuestions.value = []
    sources.value = []
    input.value = ''
    await streamConversation(trimmedMessage)
}

const openPdfModal = (source: ConversationSource) => {
    selectedSource.value = source
    isPdfModalOpen.value = true
}

const closePdfModal = () => {
    isPdfModalOpen.value = false
    selectedSource.value = null
}

watch(
    () => route.params.conversationId,
    async (newConversationId) => {
        if (!newConversationId || String(newConversationId) === conversationId.value) {
            return
        }

        messages.value = []
        conversationTitle.value = ''
        suggestedQuestions.value = []
        sources.value = []
        await loadConversationHistory()
    }
)

onMounted(async () => {
    const pendingMessage = getPendingConversationMessage(conversationId.value)

    if (pendingMessage && !messages.value.length) {
        await streamConversation(pendingMessage)
        return
    }

    await loadConversationHistory()
})
</script>

<template>
    <div class="flex h-screen flex-col bg-default">
        <header class="border-b border-default bg-default px-4 py-3 h-[64px] flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <UButton
                    icon="i-lucide-menu"
                    color="neutral"
                    variant="ghost"
                    class="lg:hidden"
                    aria-label="Open sidebar"
                    @click="openSidebar"
                />
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-muted">
                        Conversation
                    </p>
                    <h1 class="text-md font-semibold text-highlighted truncate">
                        {{ conversationTitle }}
                    </h1>
                </div>
            </div>
        </header>

        <div ref="messagesContainer" class="min-h-0 flex-1 overflow-y-auto px-4 py-6">
            <div class="mx-auto w-full max-w-3xl space-y-4">
                <template v-if="isHistoryLoading">
                    <div v-for="item in 4" :key="item" class="flex" :class="item % 2 === 0 ? 'justify-end' : 'justify-start'">
                        <div class="max-w-[75%] w-full">
                            <div class="animate-pulse rounded-xs bg-elevated h-16" />
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div v-for="message in messages" :key="message.id" class="flex"
                        :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                        <div class="max-w-[80%] rounded-xs px-4 py-2.5 text-sm whitespace-pre-wrap break-words"
                            :class="message.role === 'user' ? 'bg-primary text-inverted' : 'bg-elevated text-highlighted'">
                            <template v-if="message.content">
                                {{ message.content }}
                            </template>
                            <template v-else-if="message.role === 'assistant' && isLoading">
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex gap-1.5">
                                        <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay: 0s" />
                                        <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay: 0.15s" />
                                        <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay: 0.3s" />
                                    </span>
                                </div>
                            </template>
                        </div>
                    </div>
                </template>

                <div v-if="sources.length > 0" class="space-y-2 mt-4">
                    <p class="text-xs font-medium uppercase tracking-wide text-muted">
                        Sources
                    </p>

                    <div class="space-y-1">
                        <button
                            v-for="(source, index) in sources"
                            :key="`${source.file_name}-${index}`"
                            type="button"
                            class="w-full text-left block rounded-xs border border-default bg-default px-3 py-2 text-xs text-primary transition hover:bg-primary/5 hover:border-primary/40"
                            @click="openPdfModal(source)"
                        >
                            <div class="flex items-center justify-between gap-2">
                                <div class="min-w-0 flex-1 flex items-start gap-2">
                                    <UIcon name="i-lucide-file" class="shrink-0 w-4 h-4 mt-0.5" />
                                    <div class="min-w-0 flex-1">
                                        <p class="truncate font-medium">{{ source.file_name }}</p>
                                        <p v-if="source.page_number" class="text-muted text-xs">
                                            Page {{ source.page_number }}
                                        </p>
                                    </div>
                                </div>
                                <span class="shrink-0">⤢</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div v-if="suggestedQuestions.length > 0" class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-wide text-muted">
                        Suggested questions
                    </p>

                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="question in suggestedQuestions"
                            :key="question"
                            type="button"
                            class="rounded-xs border border-default bg-default px-3 py-2 text-left text-xs text-highlighted transition hover:border-primary/40 hover:bg-primary/5"
                            @click="input = question"
                        >
                            {{ question }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="border-t border-default bg-default p-4">
            <div class="mx-auto w-full max-w-3xl">
                <div class="space-y-2">
                    <div class="flex items-end gap-2 rounded-xs border border-default bg-default p-2">
                        <UTextarea v-model="input" placeholder="Type a message..." autoresize :rows="1" :maxrows="6" variant="none"
                            class="flex-1" :class="inputError ? 'border-error' : ''" @keydown="handleKeydown" @blur="validateInputMessage(input)" />

                        <UButton icon="i-lucide-send" class="rounded-xs" color="primary" :loading="isLoading"
                            :disabled="!input.trim() || isLoading" aria-label="Send message" @click="handleSend" />
                    </div>

                    <p v-if="inputError" class="text-xs text-error">
                        {{ inputError }}
                    </p>
                </div>
            </div>
        </div>

       <PdfViewerModal
        v-model:open="isPdfModalOpen"
        :source-url="selectedSource?.url"
        :source-file-name="selectedSource?.file_name"
        :source-page-number="selectedSource?.page_number"
    />
    </div>
</template>