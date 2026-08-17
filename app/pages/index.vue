<!-- app/pages/index.vue -->
<template>
  <div class="relative h-[calc(100vh-4rem)]">
    <div
      v-if="messages.length === 0"
      class="absolute inset-0 flex items-center justify-center px-4"
    >
      <div class="w-full max-w-2xl">
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-semibold text-highlighted">
            Ask about the available information
          </h1>

          <p class="mt-2 text-sm text-muted">
            Get answers based on the provided knowledge base
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-end gap-2 rounded-xs border border-default bg-default p-2">
            <UTextarea
              v-model="input"
              placeholder="Type a message..."
              autoresize
              :rows="1"
              :maxrows="6"
              variant="none"
              class="flex-1"
              :class="inputError ? 'border-error' : ''"
              @keydown="handleKeydown"
              @blur="validateMessage(input)"
            />

            <UButton
              icon="i-lucide-send"
              class="rounded-xs"
              color="primary"
              :loading="isLoading"
              :disabled="!input.trim()"
              aria-label="Send message"
              @click="() => sendMessage()"
            />
          </div>

          <p v-if="inputError" class="text-xs text-error">
            {{ inputError }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else
      class="absolute inset-0 flex min-h-0 flex-col"
    >
      <div
        ref="messagesContainer"
        class="min-h-0 flex-1 overflow-y-auto"
      >
        <div class="mx-auto w-full max-w-3xl px-4 py-6">
          <div class="space-y-4">
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-xs px-4 py-2.5 text-sm whitespace-pre-wrap break-words"
                :class="message.role === 'user' ? 'bg-primary text-inverted' : 'bg-elevated text-highlighted'"
              >
                {{ message.content }}
              </div>
            </div>

            <div
              v-if="isLoading"
              class="flex justify-start"
            >
              <div class="rounded-2xl bg-elevated px-4 py-2.5 text-sm text-muted">
                Typing...
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 p-4">
        <div class="mx-auto w-full max-w-3xl">
          <div class="space-y-2">
            <div class="flex items-end gap-2 rounded-xs border border-default bg-default p-2">
              <UTextarea
                v-model="input"
                placeholder="Type a message..."
                autoresize
                :rows="1"
                :maxrows="6"
                variant="none"
                class="flex-1"
                :class="inputError ? 'border-error' : ''"
                @keydown="handleKeydown"
                @blur="validateMessage(input)"
              />

              <UButton
                icon="i-lucide-send"
                class="rounded-xs"
                color="primary"
                :loading="isLoading"
                :disabled="!input.trim()"
                aria-label="Send message"
                @click="() => sendMessage()"
              />
            </div>

            <p v-if="inputError" class="text-xs text-error">
              {{ inputError }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { ChatMessage } from '~/types/conversation'
import { createConversation, setPendingConversationMessage } from '~/services/conversation'
import { useErrorHandler } from '~/composables/useErrorHandler'

const chatMessageSchema = z.object({
  message: z.string().trim().min(1, 'Please enter a message.')
})

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputError = ref('')
const { handleError } = useErrorHandler()

const validateMessage = (value: string) => {
  const result = chatMessageSchema.safeParse({ message: value })
  inputError.value = result.success ? '' : result.error.flatten().fieldErrors.message?.[0] ?? ''
  return result.success
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()

    const content = input.value.trim()

    if (!isLoading.value && validateMessage(content)) {
      input.value = ''
      void sendMessage(content)
    }
  }
}

const scrollToBottom = async () => {
  await nextTick()

  messagesContainer.value?.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth'
  })
}

const sendMessage = async (contentOverride?: string) => {
  const content = (contentOverride ?? input.value).trim()

  if (isLoading.value || !validateMessage(content)) {
    return
  }

  isLoading.value = true

  try {
    const conversationId = await createConversation(content)

    input.value = ''
    setPendingConversationMessage(conversationId, content)

    await navigateTo(`/${conversationId}`)
  } catch (error) {
    console.error('Failed to create conversation:', error)
    handleError(error)
  } finally {
    isLoading.value = false
  }
}
</script>
