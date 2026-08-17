<script setup lang="ts">
const { isOpen, close } = useSidebar()
const { items: chatHistory, refresh: refreshHistory, isLoading: isHistoryLoading, isLoadingMore, hasMore, loadMore } = useChatHistory()
const historyScrollContainer = ref<HTMLElement | null>(null)

const newChat = async () => {
  await navigateTo('/')
  close()
}

const openChat = async (id: string) => {
  await navigateTo(`/${id}`)
  close()
}

const handleScroll = async () => {
  if (!historyScrollContainer.value) {
    return
  }

  const element = historyScrollContainer.value
  const scrollTop = element.scrollTop
  const clientHeight = element.clientHeight
  const scrollHeight = element.scrollHeight
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 200

  console.log('Scroll event:', { scrollTop, clientHeight, scrollHeight, isNearBottom, hasMore: hasMore.value, isLoadingMore: isLoadingMore.value })

  if (isNearBottom && hasMore.value && !isLoadingMore.value) {
    console.log('Loading more...')
    await loadMore()
  }
}

onMounted(async () => {
  await refreshHistory()
})
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-black/40 lg:hidden" @click="close" />
  </Transition>

  <aside
    class="
      fixed inset-y-0 left-0 z-50 w-64
      border-r border-default bg-default
      transition-transform duration-300
      flex flex-col
      lg:translate-x-0
    "
    :class="[isOpen ? 'translate-x-0' : '-translate-x-full']"
  >
    <div class="flex h-16 items-center justify-between border-b border-default px-6">
      <NuxtLink
        to="/"
        class="text-xl font-bold text-primary"
        @click="close"
      >
        Pand AI
      </NuxtLink>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        class="lg:hidden"
        aria-label="Close sidebar"
        @click="close"
      />
    </div>

    <div class="p-4 pb-4">
      <UButton
        label="New chat"
        class="rounded-xs"
        icon="i-lucide-plus"
        color="primary"
        variant="solid"
        block
        @click="newChat"
      />
    </div>

    <div class="flex-1 flex flex-col min-h-0 p-4 pt-2 pb-24">
      <p class="mb-2 px-1 text-xs font-medium uppercase text-muted">
        History
      </p>

      <div class="flex-1 overflow-y-auto min-h-0" ref="historyScrollContainer" @scroll="handleScroll">
        <div
          v-if="isHistoryLoading"
          class="space-y-2 px-1 py-1"
        >
          <div
            v-for="item in 5"
            :key="item"
            class="animate-pulse rounded-xs bg-elevated/80 h-8"
          />
        </div>

        <div
          v-else-if="chatHistory.length === 0"
          class="px-1 py-4 text-sm text-muted"
        >
          No chat history yet. Start a new conversation!
        </div>

        <nav
          v-else
          class="space-y-1"
        >
          <button
            v-for="chat in chatHistory"
            :key="chat.id"
            type="button"
            class="
              flex w-full items-center gap-3 truncate rounded-xs px-1 py-1 text-left text-sm font-medium
              text-muted transition-colors
              hover:bg-primary/10 hover:text-primary
            "
            @click="openChat(chat.id)"
          >
            <span class="truncate">{{ chat.title }}</span>
          </button>

          <div v-if="isLoadingMore" class="space-y-2 px-1 py-1">
            <div
              v-for="item in 3"
              :key="`loading-${item}`"
              class="animate-pulse rounded-xs bg-elevated/80 h-8"
            />
          </div>
        </nav>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-0 border-t border-default bg-default p-4">
      <div class="flex items-center gap-3">
        <UAvatar src="https://i.pravatar.cc/100" alt="User" />
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-highlighted">
            Rizki Pandiwa
          </p>
          <p class="truncate text-xs text-muted">
            Software Developer
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
