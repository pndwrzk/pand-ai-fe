<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchModuleFiles, deleteModuleFile, presignUpload, createModuleFile } from '~/services/modules'
import { useToast } from '#imports'
import { useConfirmation } from '~/composables/useConfirmation'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { STATUS_LABELS, getStatusLabel } from '~/constants/fileStatus'
import type { ModuleFile } from '~/types/files'
import { FileStatus } from '~/types/files'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const moduleId = String(route.params.id ?? '')

const files = ref<ModuleFile[]>([])
const isLoading = ref(true)
const deletingFileId = ref<string | null>(null)

const SKELETON_ROWS = 5

const isModalOpen = ref(false)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const toast = useToast()

const { requestConfirmationAction } = useConfirmation()
const { handleError } = useErrorHandler()

// --- Polling for PENDING files ---
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)

const hasPendingFiles = () => files.value.some(f => f.status === FileStatus.PENDING)

const startPolling = () => {
  if (pollInterval.value) return
  pollInterval.value = setInterval(() => {
    loadFiles(true)
  }, 2000)
}

const stopPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

const loadFiles = async (silent = false) => {
  if (!moduleId) {
    isLoading.value = false
    return
  }

  if (!silent) {
    isLoading.value = true
  }

  try {
    const response = await fetchModuleFiles(moduleId)
    files.value = response.data

    if (hasPendingFiles()) {
      startPolling()
    } else {
      stopPolling()
    }
  } catch (error) {
    if (!silent) {
      console.error('fetchModuleFiles error:', error)
      handleError(error)
    }
  } finally {
    if (!silent) {
      isLoading.value = false
    }
  }
}

const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`
const formatDate = (value: string) => new Date(value).toLocaleString()

const handleDetail = (file: ModuleFile) => {
  router.push(`/dashboard/modules/${moduleId}/files/${file.id}`)
}

const handleDeleteFile = async (file: ModuleFile) => {
  const confirmed = await requestConfirmationAction({
    title: 'Delete File',
    message: `Delete file "${file.name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  }, async () => {
    deletingFileId.value = file.id

    try {
      await deleteModuleFile(moduleId, file.id)
      files.value = files.value.filter(item => item.id !== file.id)

      if (!hasPendingFiles()) {
        stopPolling()
      }
    } catch (error) {
      console.error('deleteModuleFile error:', error)
      handleError(error)
      throw error
    } finally {
      deletingFileId.value = null
    }
  })

  if (!confirmed) return
}

const handleBack = () => {
  router.push('/dashboard/modules')
}

const openAddModal = () => {
  selectedFile.value = null
  isModalOpen.value = true
}

const closeAddModal = () => {
  selectedFile.value = null
  isModalOpen.value = false
}

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (!file) {
    selectedFile.value = null
    return
  }

  if (file.type !== 'application/pdf') {
    selectedFile.value = null
    return
  }

  selectedFile.value = file
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    return
  }

  isUploading.value = true

  try {
    const presignResp = await presignUpload('application/pdf')
    const presign = presignResp.data

    if (!presign || !presign.upload_url || !presign.key) {
      throw new Error('Invalid presign response')
    }

    const uploadResp = await fetch(presign.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf'
      },
      body: selectedFile.value
    })

    if (!uploadResp.ok) {
      throw new Error('Upload failed')
    }

    // Register file in module
    const createResp = await createModuleFile(moduleId, presign.key)

    toast.add({ title: 'Success', description: createResp.message ?? 'File uploaded', color: 'success' })

    closeAddModal()

    await loadFiles()
  } catch (error) {
    console.error('file upload error:', error)
    handleError(error)
  } finally {
    isUploading.value = false
  }
}

onMounted(loadFiles)
onUnmounted(stopPolling)
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-end justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
          class="rounded-xs"
          aria-label="Back to modules"
          @click="handleBack"
        />

        <div>
          <h1 class="text-xl font-semibold">
            Module Files
          </h1>
          <p class="text-sm text-muted">
            Module ID: {{ moduleId }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          class="rounded-xs"
          @click="openAddModal"
        >
          Add File
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="isModalOpen"
      class="rounded-xs"
      title="Upload File"
      description="Upload a PDF for this module"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-2">Select file (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              @change="handleFileChange"
            >
            <div
              v-if="selectedFile"
              class="text-sm text-muted mt-2"
            >
              Selected: {{ selectedFile.name }}
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-xs"
            @click="closeAddModal"
          >
            Cancel
          </UButton>

          <UButton
            color="primary"
            class="rounded-xs"
            :loading="isUploading"
            :disabled="isUploading"
            @click="handleUpload"
          >
            Upload
          </UButton>
        </div>
      </template>
    </UModal>

    <div class="overflow-hidden rounded-xs border border-default bg-default">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default">
            <th class="px-4 py-3 text-left font-medium text-muted">
              Name
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Type
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Size
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Status
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Created
            </th>
            <th class="w-20 px-4 py-3 text-right font-medium text-muted">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-if="isLoading">
            <tr
              v-for="row in SKELETON_ROWS"
              :key="`skeleton-${row}`"
              class="border-b border-default last:border-b-0"
            >
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-40 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-16 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-20 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-20 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-32 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end">
                  <USkeleton class="h-6 w-6 rounded-full" />
                </div>
              </td>
            </tr>
          </template>


          <template v-else-if="!files.length">
            <tr class="border-b border-default">
              <td
                colspan="6"
                class="px-4 py-6 text-center text-muted"
              >
                No files found for this module.
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="file in files"
              :key="file.id"
              class="border-b border-default last:border-b-0 hover:bg-muted/50"
            >
              <td class="px-4 py-3 font-medium text-highlighted">
                {{ file.name }}
              </td>
              <td class="px-4 py-3 text-muted">
                {{ file.type }}
              </td>
              <td class="px-4 py-3 text-muted">
                {{ formatSize(file.size) }}
              </td>
              <td class="px-4 py-3">
                <div
                  v-if="file.status === FileStatus.PENDING"
                  class="flex items-center gap-2 text-muted"
                >
                  <UIcon
                    name="i-lucide-loader-2"
                    class="size-4 animate-spin"
                  />
                  Processing
                </div>
                <span v-else>{{ getStatusLabel(file.status) }}</span>
              </td>
              <td class="px-4 py-3 text-muted">
                {{ formatDate(file.created_at) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end">
                  <UPopover>
                    <UButton
                      icon="i-lucide-ellipsis"
                      color="primary"
                      variant="ghost"
                      size="sm"
                      aria-label="Actions"
                    />

                    <template #content>
                      <div class="w-36 p-1">
                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm text-highlighted hover:bg-muted"
                          @click="handleDetail(file)"
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="deletingFileId === file.id"
                          @click="handleDeleteFile(file)"
                        >
                          Delete
                        </button>
                      </div>
                    </template>
                  </UPopover>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
