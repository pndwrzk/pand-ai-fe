import { ref, nextTick } from 'vue'
import type { FileContent, ModuleFile } from '~/types/files'
import { fetchFileContent, fetchFileDetail } from '~/services/modules'
import { useErrorHandler } from '~/composables/useErrorHandler'

export const useFileDetailLoader = () => {
  const file = ref<ModuleFile | null>(null)
  const isLoading = ref(true)

  const { handleError } = useErrorHandler()

  const loadPageContent = async (pageNumber: number) => {
    if (!file.value?.contents?.length) return

    const matchedContent = file.value.contents.find((content) => content.page_number === pageNumber)

    if (!matchedContent) return

    try {
      const contentData = await fetchFileContent(matchedContent.id)

      const targetIndex = file.value.contents.findIndex((content) => content.id === matchedContent.id)

      if (targetIndex >= 0) {
        file.value.contents[targetIndex] = {
          ...file.value.contents[targetIndex],
          ...contentData
        }
      }
    } catch (error) {
      console.error('loadPageContent error:', error)
      handleError(error)
    }
  }

  const loadFile = async (
    fileId: string,
    moduleId: string,
    isEditorReady: boolean,
    syncEditorFromActiveContent: () => Promise<void>
  ) => {
    if (!moduleId || !fileId) {
      isLoading.value = false
      return
    }

    isLoading.value = true

    try {
      const response = await fetchFileDetail(fileId)

      if (!response) {
        file.value = null
        return
      }

      file.value = response

      const firstPageNumber = response.contents?.[0]?.page_number ?? 1

      if (response.total_contents && response.total_contents > 0 && response.contents?.length) {
        file.value.contents = response.contents.map((content) => ({ ...content }))
      }

      await loadPageContent(firstPageNumber)

      if (isEditorReady) {
        await nextTick()
        await syncEditorFromActiveContent()
      }

      return firstPageNumber
    } catch (error) {
      console.error('loadFile error:', error)
      handleError(error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    file,
    isLoading,
    loadFile,
    loadPageContent
  }
}
