import { ref, watch, type Component, nextTick, type Ref } from 'vue'
import type { FileContent } from '~/types/files'

export const useCkeditorEditor = (
  activeContent: { value: FileContent | null },
  isEditable: { value: boolean },
  isSyncingEditor: Ref<boolean>
) => {
  const Ckeditor = ref<Component | null>(null)
  const ClassicEditor = ref<unknown>(null)
  const editorConfig = ref<Record<string, unknown> | null>(null)
  const editorData = ref('')
  const editorInstance = ref<{ setData: (value: string) => void } | null>(null)
  const isEditorReady = ref(false)
  const isDirty = ref(false)

  const loadEditor = async () => {
    if (!import.meta.client) return

    try {
      const [ckeditorVue, ckeditor] = await Promise.all([
        import('@ckeditor/ckeditor5-vue'),
        import('ckeditor5')
      ])

      Ckeditor.value = ckeditorVue.Ckeditor
      ClassicEditor.value = ckeditor.ClassicEditor

      editorConfig.value = {
        licenseKey: 'GPL',
        plugins: [
          ckeditor.Essentials,
          ckeditor.Paragraph,
          ckeditor.Heading,
          ckeditor.Bold,
          ckeditor.Italic,
          ckeditor.Underline,
          ckeditor.Link,
          ckeditor.List,
          ckeditor.BlockQuote,
          ckeditor.Undo
        ],
        toolbar: [
          'undo', 'redo', '|',
          'heading', '|',
          'bold', 'italic', 'underline', '|',
          'link', '|',
          'bulletedList', 'numberedList', '|',
          'blockQuote'
        ],
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: 'https://'
        }
      }

      isEditorReady.value = true
      await syncEditorFromActiveContent()
    } catch (error) {
      console.error('Failed to load CKEditor:', error)
      throw error
    }
  }

  const syncEditorFromActiveContent = async () => {
    isSyncingEditor.value = true
    isDirty.value = false
    const newData = activeContent.value?.content ?? ''

    // update v-model
    editorData.value = newData

    // also update editor instance directly if available to avoid shadow copies
    try {
      if (editorInstance.value && typeof editorInstance.value.setData === 'function') {
        editorInstance.value.setData(newData)
      }
    } catch (e) {
      console.error('Failed to set editor instance data:', e)
    }

    await nextTick()
    isSyncingEditor.value = false
  }

  const onEditorReady = (editor: { setData: (value: string) => void }) => {
    editorInstance.value = editor as { setData: (value: string) => void }
  }

  const resetContent = async () => {
    if (!activeContent.value || !isEditable.value) return

    const original = activeContent.value?.content ?? ''

    // update both model and editor instance
    // prevent the editor-data watcher from treating this programmatic set as a user edit
    isSyncingEditor.value = true

    editorData.value = original

    try {
      if (editorInstance.value && typeof editorInstance.value.setData === 'function') {
        editorInstance.value.setData(original)
      }
    } catch (e) {
      console.error('Failed to reset editor data on instance:', e)
    }

    await nextTick()
    isSyncingEditor.value = false

    // mark dirty if the reset value differs from the currently saved content
    const saved = activeContent.value.content ?? ''
    isDirty.value = original !== saved
  }

  watch(editorData, () => {
    if (isSyncingEditor.value || !activeContent.value || !isEditable.value) return
    isDirty.value = true
  })

  return {
    Ckeditor,
    ClassicEditor,
    editorConfig,
    editorData,
    editorInstance,
    isEditorReady,
    isDirty,
    loadEditor,
    syncEditorFromActiveContent,
    onEditorReady,
    resetContent
  }
}
