import { ref, computed, type ComputedRef } from 'vue'
import type { ModuleFile, FileContent } from '~/types/files'

export const usePdfViewer = (file: { value: ModuleFile | null }, activeContent: ComputedRef<FileContent | null>) => {
  const currentPage = ref(1)
  const pdfError = ref(false)
  const isPdfLoading = ref(true)
  const maxPageOverride = ref<number | null>(null)

  const CONTENT_STATUS = {
    EDITABLE: 0,
    APPROVED: 1
  } as const

  const hasContents = computed(() => !!file.value?.contents?.length)

  const maxPage = computed(() => {
    if (maxPageOverride.value && maxPageOverride.value > 0) {
      return maxPageOverride.value
    }

    if (!file.value?.contents?.length) {
      return currentPage.value
    }

    return Math.max(...file.value.contents.map(content => content.page_number))
  })

  const isEditable = computed(() => Number(activeContent.value?.status) === CONTENT_STATUS.EDITABLE)

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

    if (hasContents.value && page > maxPage.value) {
      currentPage.value = maxPage.value
      return
    }

    currentPage.value = page
  }

  return {
    currentPage,
    pdfError,
    isPdfLoading,
    maxPageOverride,
    hasContents,
    maxPage,
    isEditable,
    CONTENT_STATUS,
    handlePdfLoaded,
    handlePdfError,
    handleContentPage
  }
}
