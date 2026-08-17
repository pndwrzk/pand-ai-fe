import { ref, nextTick } from 'vue'
import type { ModuleFile } from '~/types/files'
import { fetchFileDetail } from '~/services/modules'
import { useErrorHandler } from '~/composables/useErrorHandler'

export const useFileDetailLoader = () => {
  const file = ref<ModuleFile | null>(null)
  const isLoading = ref(true)

  const { handleError } = useErrorHandler()

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

      // Reset to first page
      const firstPageNumber = response.contents?.[0]?.page_number ?? 1

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
    loadFile
  }
}
