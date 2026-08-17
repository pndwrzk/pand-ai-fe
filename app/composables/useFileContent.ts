import { ref } from 'vue'
import type { FileContent } from '~/types/files'
import { updateFileContent, updateFileContentStatus } from '~/services/modules'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useConfirmation } from '~/composables/useConfirmation'

export const useFileContent = () => {
  const isSaving = ref(false)
  const isApproving = ref(false)

  const toast = useToast()
  const { requestConfirmation } = useConfirmation()
  const { handleError } = useErrorHandler()

  const CONTENT_STATUS = {
    EDITABLE: 0,
    PROCESSING: 1,
    APPROVED: 2,
    FAILED: -1
  } as const

  const updateContent = async (
    activeContent: FileContent | null,
    isEditable: boolean,
    isDirty: boolean,
    editorData: string
  ): Promise<boolean> => {
    if (!activeContent || !isEditable || !isDirty || isSaving.value || isApproving.value) {
      return false
    }

    const confirmed = await requestConfirmation({
      title: 'Update Content',
      message: 'Save changes to this page content?',
      confirmText: 'Update',
      cancelText: 'Cancel'
    })

    if (!confirmed) return false

    isSaving.value = true

    try {
      const html = editorData
      const response = await updateFileContent(activeContent.id, html)

      activeContent.content = html

      if (response?.message) {
        toast.add({ title: 'Success', description: response.message, color: 'success' })
      }

      return true
    } catch (error) {
      console.error('updateContent error:', error)
      handleError(error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  const approveContent = async (activeContent: FileContent | null): Promise<boolean> => {
    if (!activeContent || isSaving.value || isApproving.value) return false

    const isCurrentlyApproved = Number(activeContent.status) === CONTENT_STATUS.APPROVED
    const nextStatus = isCurrentlyApproved ? CONTENT_STATUS.EDITABLE : CONTENT_STATUS.APPROVED
    const isApprove = nextStatus === CONTENT_STATUS.APPROVED

    const confirmed = await requestConfirmation({
      title: isApprove ? 'Approve Content' : 'Unapprove Content',
      message: isApprove
        ? 'Approve this page content? The content will become read-only.'
        : 'Cancel approval for this page content? The content will become editable again.',
      confirmText: isApprove ? 'Approve' : 'Unapprove',
      cancelText: 'Cancel'
    })

    if (!confirmed) return false

    isApproving.value = true

    try {
      const response = await updateFileContentStatus(activeContent.id, nextStatus)

      activeContent.status = nextStatus

      if (response?.message) {
        toast.add({ title: 'Success', description: response.message, color: 'success' })
      }

      return true
    } catch (error) {
      console.error('approveContent error:', error)
      handleError(error)
      return false
    } finally {
      isApproving.value = false
    }
  }

  return {
    isSaving,
    isApproving,
    updateContent,
    approveContent,
    CONTENT_STATUS
  }
}
