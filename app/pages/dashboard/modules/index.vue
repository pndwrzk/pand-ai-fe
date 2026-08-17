<script setup lang="ts">
import { z } from 'zod'
import { onMounted, reactive, ref } from 'vue'
import {
  fetchModules,
  createModule,
  updateModule,
  deleteModule
} from '~/services/modules'
import type { ModuleItem } from '~/types/modules'
import { useConfirmation } from '~/composables/useConfirmation'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'dashboard'
})

const moduleSchema = z.object({
  name: z.string().trim().min(1, 'Module name is required.').max(100, 'Module name is too long.'),
  description: z.string().trim().max(500, 'Description is too long.').optional().or(z.literal(''))
})

const modules = ref<ModuleItem[]>([])
const selectedModule = ref<ModuleItem | null>(null)

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)

const isModalOpen = ref(false)
const formErrors = ref({
  name: '',
  description: ''
})

const SKELETON_ROWS = 5

const { handleError } = useErrorHandler()

const form = reactive({
  name: '',
  description: ''
})

const resetForm = () => {
  form.name = ''
  form.description = ''
  formErrors.value = { name: '', description: '' }
}

const closeModal = () => {
  selectedModule.value = null
  resetForm()
  isModalOpen.value = false
}

const openCreateModal = () => {
  selectedModule.value = null
  resetForm()
  isModalOpen.value = true
}

const openEditModal = (module: ModuleItem) => {
  selectedModule.value = module
  form.name = module.name
  form.description = module.description ?? ''
  isModalOpen.value = true
}

const loadModules = async () => {
  isLoading.value = true

  try {
    modules.value = await fetchModules()
  } catch (error) {
    console.error('fetchModules error:', error)
    handleError(error)
  } finally {
    isLoading.value = false
  }
}

const validateForm = () => {
  const result = moduleSchema.safeParse({
    name: form.name,
    description: form.description
  })

  formErrors.value = {
    name: result.success ? '' : result.error.flatten().fieldErrors.name?.[0] ?? '',
    description: result.success ? '' : result.error.flatten().fieldErrors.description?.[0] ?? ''
  }

  return result.success
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSaving.value = true

  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null
    }

    if (selectedModule.value) {
      const updated = await updateModule(selectedModule.value.id, payload)
      const index = modules.value.findIndex(item => item.id === updated.id)
      if (index !== -1) modules.value[index] = updated
    } else {
      const created = await createModule(payload)
      modules.value.unshift(created)
    }

    closeModal()
  } catch (error) {
    console.error('save module error:', error)
    handleError(error)
  } finally {
    isSaving.value = false
  }
}

const { requestConfirmationAction } = useConfirmation()

const handleDelete = async (module: ModuleItem) => {
  const confirmed = await requestConfirmationAction({
    title: 'Delete Module',
    message: `Delete module "${module.name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  }, async () => {
    isDeleting.value = true

    try {
      await deleteModule(module.id)
      modules.value = modules.value.filter(item => item.id !== module.id)
    } catch (error) {
      console.error('delete module error:', error)
      handleError(error)
      throw error
    } finally {
      isDeleting.value = false
    }
  })

  if (!confirmed) return
}

onMounted(loadModules)
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-highlighted">
          Modules
        </h1>
        <p class="text-sm text-muted">
          Manage available modules for this workspace.
        </p>
      </div>

      <UButton
        color="primary"
        class="rounded-xs"
        @click="openCreateModal"
      >
        Add Module
      </UButton>
    </div>

    <UModal
      v-model:open="isModalOpen"
      class="rounded-xs"
      :title="selectedModule ? 'Edit Module' : 'Add Module'"
      :description="selectedModule ? 'Update module details.' : 'Create a new module for this workspace.'"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <UFormField
            label="Name"
            required
          >
            <UInput
              v-model="form.name"
              placeholder="e.g. Human Resources"
              class="w-full"
              :ui="{ base: 'rounded-xs' }"
              :class="formErrors.name ? 'border-error' : ''"
              @blur="validateForm"
            />
            <p v-if="formErrors.name" class="mt-1 text-xs text-error">
              {{ formErrors.name }}
            </p>
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="form.description"
              placeholder="Short description of this module"
              class="w-full"
              :rows="3"
              :ui="{ base: 'rounded-xs' }"
              :class="formErrors.description ? 'border-error' : ''"
              @blur="validateForm"
            />
            <p v-if="formErrors.description" class="mt-1 text-xs text-error">
              {{ formErrors.description }}
            </p>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              class="rounded-xs"
              @click="closeModal"
            >
              Cancel
            </UButton>

            <UButton
              type="submit"
              color="primary"
              class="rounded-xs"
              :loading="isSaving"
              :disabled="isSaving"
            >
              {{ selectedModule ? 'Update Module' : 'Add Module' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <div class="overflow-hidden rounded-xs border border-default bg-default">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default">
            <th class="w-16 px-4 py-3 text-left font-medium text-muted">
              No
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Name
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Description
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Created At
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
                <USkeleton class="h-4 w-6 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-32 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-48 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end">
                  <USkeleton class="h-6 w-6 rounded-full" />
                </div>
              </td>
            </tr>
          </template>

          <template v-else-if="!modules.length">
            <tr class="border-b border-default">
              <td
                colspan="4"
                class="px-4 py-6 text-center text-muted"
              >
                No modules available.
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="(module, index) in modules"
              :key="module.id"
              class="group border-b border-default last:border-b-0 hover:bg-muted/50"
            >
              <td class="px-4 py-3 text-muted">
                {{ index + 1 }}
              </td>

              <td class="px-4 py-3 font-medium text-highlighted">
                {{ module.name }}
              </td>

              <td class="px-4 py-3 text-muted">
                {{ module.description ?? '-' }}
              </td>

              <td class="px-4 py-3 text-muted">
                {{ module.created_at ? new Date(module.created_at).toLocaleString() : '-' }}
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
                        <NuxtLink
                          :to="`/dashboard/modules/${module.id}/files`"
                          class="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm text-highlighted hover:bg-muted"
                        >
                          Detail
                        </NuxtLink>

                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm text-highlighted hover:bg-muted"
                          @click="openEditModal(module)"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm text-error hover:bg-error/10 disabled:opacity-50"
                          :disabled="isDeleting"
                          @click="handleDelete(module)"
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
