<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent } from 'vue'

const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'))

interface Props {
  open: boolean
  sourceUrl?: string
  sourceFileName?: string
  sourcePageNumber?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const currentPage = ref(1)
const pdfError = ref(false)
const isPdfLoading = ref(true)
const maxPageOverride = ref<number | null>(null)

const maxPage = computed(() => {
  if (maxPageOverride.value && maxPageOverride.value > 0) {
    return maxPageOverride.value
  }
  return currentPage.value
})

const handlePdfLoaded = (doc: { numPages?: number } | null | undefined) => {
  pdfError.value = false
  isPdfLoading.value = false

  if (doc?.numPages) {
    maxPageOverride.value = doc.numPages
  }
}

const handlePdfError = (error: unknown) => {
  console.error('PDF load error:', error)
  pdfError.value = true
  isPdfLoading.value = false
}

const handleContentPage = (page: number) => {
  if (page < 1) {
    currentPage.value = 1
    return
  }

  if (page > maxPage.value) {
    currentPage.value = maxPage.value
    return
  }

  currentPage.value = page
}

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    currentPage.value = props.sourcePageNumber ?? 1
    pdfError.value = false
    isPdfLoading.value = true
    maxPageOverride.value = null
  }
})

const closeModal = () => {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    class="rounded-xs"
    :title="sourceFileName ?? 'PDF Viewer'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Page Navigation -->
        <div class="flex items-center justify-between gap-4 border-b border-default pb-3">
          <div>
            <p class="text-sm font-semibold">
              Page {{ currentPage }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              class="rounded-xs"
              :disabled="currentPage <= 1"
              aria-label="Previous page"
              @click="handleContentPage(currentPage - 1)"
            >
              Previous
            </UButton>

            <span class="min-w-20 text-center text-sm text-muted">
              {{ currentPage }} / {{ maxPage }}
            </span>

            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              class="rounded-xs"
              :disabled="currentPage >= maxPage"
              aria-label="Next page"
              @click="handleContentPage(currentPage + 1)"
            >
              Next
            </UButton>
          </div>
        </div>

        <!-- PDF Viewer -->
        <div class="relative min-h-0 overflow-auto border border-default rounded-xs bg-gray-100 p-2" style="height: 60vh;">
          <div v-if="sourceUrl">
            <ClientOnly>
              <USkeleton
                v-if="isPdfLoading && !pdfError"
                class="absolute inset-2"
              />

              <VuePdfEmbed
                v-if="!pdfError"
                :source="sourceUrl"
                :page="currentPage"
                @loaded="handlePdfLoaded"
                @loading-failed="handlePdfError"
                @rendering-failed="handlePdfError"
              />

              <div
                v-else
                class="p-6 text-center text-muted"
              >
                PDF preview is unavailable.
              </div>
            </ClientOnly>
          </div>

          <div
            v-else
            class="p-6 text-center text-muted"
          >
            PDF preview is unavailable.
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>