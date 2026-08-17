<script setup lang="ts">
import 'ckeditor5/ckeditor5.css'
import { computed, watch, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FileContent } from '~/types/files'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { STATUS_LABELS, getStatusLabel } from '~/constants/fileStatus'
import { usePdfViewer } from '~/composables/usePdfViewer'
import { useCkeditorEditor } from '~/composables/useCkeditorEditor'
import { useFileContent } from '~/composables/useFileContent'
import { useFileDetailLoader } from '~/composables/useFileDetailLoader'
import VuePdfEmbed from 'vue-pdf-embed'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()

const moduleId = String(route.params.id ?? '')
const fileId = String(route.params.fileId ?? '')

const { handleError } = useErrorHandler()

const { file, isLoading, loadFile } = useFileDetailLoader()


const isSyncingEditor = ref(false)

const activeContent = computed<FileContent | null>(() => {
  if (!file.value?.contents?.length) return null
  return file.value.contents.find((content: FileContent) => content.page_number === currentPage.value) ?? null
})


const {
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
} = usePdfViewer(file, activeContent)

// CKEditor state
const {
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
} = useCkeditorEditor(activeContent, isEditable, isSyncingEditor)

// File content actions
const { isSaving, isApproving, updateContent: updateContentAction, approveContent: approveContentAction } = useFileContent()

const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`

const updateContent = async () => {
  const success = await updateContentAction(
    activeContent.value,
    isEditable.value,
    isDirty.value,
    editorData.value
  )
  
  if (success) {
    isDirty.value = false
  }
}

const approveContent = async () => {
  const success = await approveContentAction(activeContent.value)
  
  if (success) {
    isDirty.value = false
  }
}

watch(editorData, () => {
  if (isSyncingEditor.value || !activeContent.value || !isEditable.value) return
  isDirty.value = true
})

watch(currentPage, async () => {
  pdfError.value = false
  isPdfLoading.value = true

  if (!isEditorReady.value) return
  await syncEditorFromActiveContent()
})

const handleBack = () => {
  router.push(`/dashboard/modules/${moduleId}/files`)
}

onMounted(async () => {
  const firstPageNumber = await loadFile(
    fileId,
    moduleId,
    isEditorReady.value,
    syncEditorFromActiveContent
  )
  
  if (firstPageNumber) {
    currentPage.value = firstPageNumber
  }
  
  await loadEditor()
})
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">
          File Detail
        </h1>
        <p class="text-sm text-muted">
          Module ID: {{ moduleId }} — File ID: {{ fileId }}
        </p>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="space-y-6"
    >
      <div class="rounded-xs border border-default bg-default p-4">
        <USkeleton class="mb-2 h-5 w-32" />
        <USkeleton class="mb-4 h-4 w-56" />
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="i in 4"
            :key="i"
            class="space-y-2"
          >
            <USkeleton class="h-4 w-16" />
            <USkeleton class="h-4 w-24" />
          </div>
        </div>
        <div class="mt-6 flex gap-3">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-8 w-28" />
        </div>
      </div>

      <div class="overflow-hidden rounded-xs border border-default bg-default">
        <div class="flex items-center justify-between gap-4 border-b border-default px-4 py-3">
          <USkeleton class="h-5 w-24" />
          <USkeleton class="h-8 w-48" />
        </div>
        <div class="grid h-[70vh] min-h-0 xl:grid-cols-2">
          <div class="border-b border-default p-2 xl:border-b-0 xl:border-r">
            <USkeleton class="h-full w-full" />
          </div>
          <div class="p-4">
            <USkeleton class="h-full w-full" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div class="rounded-xs border border-default bg-default p-4">
        <div class="mb-4">
          <h2 class="text-base font-semibold">
            File Details
          </h2>
          <p class="text-sm text-muted">
            Basic file information.
          </p>
        </div>

        <div class="grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p class="font-medium text-highlighted">
              Name
            </p>
            <p>{{ file?.name ?? '-' }}</p>
          </div>
          <div>
            <p class="font-medium text-highlighted">
              Type
            </p>
            <p>{{ file?.type ?? '-' }}</p>
          </div>
          <div>
            <p class="font-medium text-highlighted">
              Size
            </p>
            <p>{{ file ? formatSize(file.size) : '-' }}</p>
          </div>
          <div>
            <p class="font-medium text-highlighted">
              Status
            </p>
            <p>{{ file ? getStatusLabel(file.status) : '-' }}</p>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            color="primary"
            variant="outline"
            size="sm"
            class="rounded-xs"
            :href="file?.url"
            target="_blank"
            rel="noreferrer"
            :disabled="!file?.url"
          >
            Open File
          </UButton>

          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            class="rounded-xs"
            @click="handleBack"
          >
            Back to Files
          </UButton>
        </div>
      </div>

      <div class="overflow-hidden rounded-xs border border-default bg-default">
        <div class="flex items-center justify-between gap-4 border-b border-default bg-default px-4 py-3">
          <div>
            <h2 class="text-base font-semibold">
              Page {{ currentPage }}
            </h2>
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
              Page {{ currentPage }} of {{ maxPage }}
            </span>

            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              class="rounded-xs"
              :disabled="!hasContents || currentPage >= maxPage"
              aria-label="Next page"
              @click="handleContentPage(currentPage + 1)"
            >
              Next
            </UButton>
          </div>
        </div>

        <div class="grid h-[70vh] min-h-0 xl:grid-cols-2">
          <div class="relative min-h-0 overflow-auto border-b border-default p-2 xl:border-b-0 xl:border-r">
            <div v-if="file?.url">
              <ClientOnly>
                <USkeleton
                  v-if="isPdfLoading && !pdfError"
                  class="absolute inset-2"
                />

                <VuePdfEmbed
                  v-if="!pdfError"
                  :source="file.url"
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

          <div class="min-h-0 overflow-auto p-4">
            <div
              v-if="!activeContent"
              class="text-sm text-muted"
            >
              No content is available for this page.
            </div>

            <div v-else>
              <USkeleton
                v-if="!isEditorReady"
                class="h-[300px] w-full"
              />

              <div
                v-else
                class="ck-editor-shell min-h-[300px] w-full overflow-hidden rounded-md border border-default bg-white"
              >
                <ClientOnly>
                  <component
                    :is="Ckeditor"
                    v-model="editorData"
                    :editor="ClassicEditor"
                    :config="editorConfig"
                    :disabled="!isEditable"
                    class="ck-editor-instance"
                    @ready="onEditorReady"
                  />
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-default bg-default px-4 py-3">
          <template v-if="isEditorReady && activeContent">
            <template v-if="isEditable">
              <!-- <UButton color="neutral" variant="ghost" size="sm" class="rounded-xs"
                                :disabled="!isDirty || isSaving || isApproving" @click="cancelEdit">
                                Cancel
                            </UButton> -->

              <UButton
                color="info"
                variant="outline"
                size="sm"
                class="rounded-xs"
                :disabled="isSaving || isApproving"
                @click="resetContent"
              >
                Reset
              </UButton>

              <UButton
                color="primary"
                variant="outline"
                size="sm"
                class="rounded-xs"
                :disabled="!isDirty || isSaving || isApproving"
                :loading="isSaving"
                @click="updateContent"
              >
                Update
              </UButton>
            </template>

            <UButton
              color="primary"
              size="sm"
              class="rounded-xs"
              :disabled="isSaving || isApproving"
              :loading="isApproving"
              @click="approveContent"
            >
              {{ isEditable ? 'Approve' : 'Unapprove' }}
            </UButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ck-editor-instance) {
  display: block;
  width: 100%;
}

:deep(.ck.ck-editor__main) {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 0.5rem;
  overflow: hidden;
  background: #fff;
}

:deep(.ck-editor__editable),
:deep(.ck-editor__editable_inline),
:deep(.ck-editor__editable[role='textbox']) {
  min-height: 320px;
  max-height: 60vh;
  overflow: auto;
  padding: 0.75rem 1rem;
  box-sizing: border-box;
}

:deep(.ck-content) {
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>
