<script setup lang="ts">
import { z } from 'zod'
import { onMounted, reactive, ref } from 'vue'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser
} from '~/services/users'
import type { UserItem } from '~/types/users'
import { useConfirmation } from '~/composables/useConfirmation'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { UserRole, type UserRoleType } from '~/constants/userRole'
import { UserStatus, type UserStatusType } from '~/constants/userStatus'

definePageMeta({
  layout: 'dashboard'
})

const roleOptions = [
  { label: 'User', value: UserRole.USER },
  { label: 'Admin', value: UserRole.ADMIN },
  { label: 'Superadmin', value: UserRole.SUPERADMIN }
]

const statusOptions = [
  { label: 'Active', value: UserStatus.ACTIVE },
  { label: 'Inactive', value: UserStatus.INACTIVE }
]

const roleLabel = (role: number) => roleOptions.find(item => item.value === role)?.label ?? '-'
const statusLabel = (status: number) => statusOptions.find(item => item.value === status)?.label ?? '-'

const userSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required.').max(100, 'Full name is too long.'),
  email: z.string().trim().min(1, 'Email is required.').email('Email is not valid.'),
  username: z.string().trim().min(1, 'Username is required.').max(50, 'Username is too long.'),
  password: z.string().trim().optional().or(z.literal('')),
  role: z.number(),
  status: z.number()
})

const users = ref<UserItem[]>([])
const selectedUser = ref<UserItem | null>(null)

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)

const isModalOpen = ref(false)
const formErrors = ref({
  full_name: '',
  email: '',
  username: '',
  password: '',
  role: '',
  status: ''
})

const SKELETON_ROWS = 5

const { handleError } = useErrorHandler()

const form = reactive({
  full_name: '',
  email: '',
  username: '',
  password: '',
  role: UserRole.USER as UserRoleType,
  status: UserStatus.ACTIVE as UserStatusType
})

const resetForm = () => {
  form.full_name = ''
  form.email = ''
  form.username = ''
  form.password = ''
  form.role = UserRole.USER
  form.status = UserStatus.ACTIVE
  formErrors.value = { full_name: '', email: '', username: '', password: '', role: '', status: '' }
}

const closeModal = () => {
  selectedUser.value = null
  resetForm()
  isModalOpen.value = false
}

const openCreateModal = () => {
  selectedUser.value = null
  resetForm()
  isModalOpen.value = true
}

const openEditModal = (user: UserItem) => {
  selectedUser.value = user
  form.full_name = user.full_name
  form.email = user.email
  form.username = user.username
  form.password = ''
  form.role = user.role
  form.status = user.status
  isModalOpen.value = true
}

const loadUsers = async () => {
  isLoading.value = true

  try {
    users.value = await fetchUsers()
  } catch (error) {
    console.error('fetchUsers error:', error)
    handleError(error)
  } finally {
    isLoading.value = false
  }
}

const validateForm = () => {
  const result = userSchema.safeParse({
    full_name: form.full_name,
    email: form.email,
    username: form.username,
    password: form.password,
    role: form.role,
    status: form.status
  })

  const fieldErrors = result.success ? null : result.error.flatten().fieldErrors

  formErrors.value = {
    full_name: fieldErrors?.full_name?.[0] ?? '',
    email: fieldErrors?.email?.[0] ?? '',
    username: fieldErrors?.username?.[0] ?? '',
    password: fieldErrors?.password?.[0] ?? '',
    role: fieldErrors?.role?.[0] ?? '',
    status: fieldErrors?.status?.[0] ?? ''
  }

  if (!selectedUser.value && !form.password.trim()) {
    formErrors.value.password = 'Password is required.'
    return false
  }

  return result.success && !formErrors.value.password
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSaving.value = true

  try {
    if (selectedUser.value) {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        role: form.role,
        status: form.status,
        ...(form.password.trim() ? { password: form.password.trim() } : {})
      }

      const updated = await updateUser(selectedUser.value.id, payload)
      const index = users.value.findIndex(item => item.id === updated.id)
      if (index !== -1) users.value[index] = updated
    } else {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        role: form.role,
        status: form.status
      }

      const created = await createUser(payload)
      users.value.unshift(created)
    }

    closeModal()
  } catch (error) {
    console.error('save user error:', error)
    handleError(error)
  } finally {
    isSaving.value = false
  }
}

const { requestConfirmationAction } = useConfirmation()

const handleDelete = async (user: UserItem) => {
  const confirmed = await requestConfirmationAction({
    title: 'Delete User',
    message: `Delete user "${user.full_name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  }, async () => {
    isDeleting.value = true

    try {
      await deleteUser(user.id)
      users.value = users.value.filter(item => item.id !== user.id)
    } catch (error) {
      console.error('delete user error:', error)
      handleError(error)
      throw error
    } finally {
      isDeleting.value = false
    }
  })

  if (!confirmed) return
}

onMounted(loadUsers)
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-highlighted">
          Users
        </h1>
        <p class="text-sm text-muted">
          Manage users who can access this workspace.
        </p>
      </div>

      <UButton
        color="primary"
        class="rounded-xs"
        @click="openCreateModal"
      >
        Add User
      </UButton>
    </div>

    <UModal
      v-model:open="isModalOpen"
      class="rounded-xs"
      :title="selectedUser ? 'Edit User' : 'Add User'"
      :description="selectedUser ? 'Update user details.' : 'Create a new user for this workspace.'"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <UFormField
            label="Full Name"
            required
          >
            <UInput
              v-model="form.full_name"
              placeholder="e.g. John Doe"
              class="w-full"
              :ui="{ base: 'rounded-xs' }"
              :class="formErrors.full_name ? 'border-error' : ''"
              @blur="validateForm"
            />
            <p v-if="formErrors.full_name" class="mt-1 text-xs text-error">
              {{ formErrors.full_name }}
            </p>
          </UFormField>

          <UFormField
            label="Email"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              placeholder="e.g. john@pand.ai"
              class="w-full"
              :ui="{ base: 'rounded-xs' }"
              :class="formErrors.email ? 'border-error' : ''"
              @blur="validateForm"
            />
            <p v-if="formErrors.email" class="mt-1 text-xs text-error">
              {{ formErrors.email }}
            </p>
          </UFormField>

          <UFormField
            label="Username"
            required
          >
            <UInput
              v-model="form.username"
              placeholder="e.g. johndoe"
              class="w-full"
              :ui="{ base: 'rounded-xs' }"
              :class="formErrors.username ? 'border-error' : ''"
              @blur="validateForm"
            />
            <p v-if="formErrors.username" class="mt-1 text-xs text-error">
              {{ formErrors.username }}
            </p>
          </UFormField>

          <UFormField
            :label="selectedUser ? 'Password' : 'Password'"
            :required="!selectedUser"
          >
            <UInput
              v-model="form.password"
              type="password"
              :placeholder="selectedUser ? 'Leave blank to keep current password' : 'Enter password'"
              class="w-full"
              :ui="{ base: 'rounded-xs' }"
              :class="formErrors.password ? 'border-error' : ''"
              @blur="validateForm"
            />
            <p v-if="formErrors.password" class="mt-1 text-xs text-error">
              {{ formErrors.password }}
            </p>
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Role"
              required
            >
              <USelect
                v-model="form.role"
                :items="roleOptions"
                value-key="value"
                class="w-full"
                :ui="{ base: 'rounded-xs' }"
              />
            </UFormField>

            <UFormField
              label="Status"
              required
            >
              <USelect
                v-model="form.status"
                :items="statusOptions"
                value-key="value"
                class="w-full"
                :ui="{ base: 'rounded-xs' }"
              />
            </UFormField>
          </div>

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
              {{ selectedUser ? 'Update User' : 'Add User' }}
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
              Full Name
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Email
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Username
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Role
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted">
              Status
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
                <USkeleton class="h-4 w-40 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-28 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-16 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-16 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <USkeleton class="h-4 w-24 rounded-xs" />
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end">
                  <USkeleton class="h-6 w-6 rounded-full" />
                </div>
              </td>
            </tr>
          </template>

          <template v-else-if="!users.length">
            <tr class="border-b border-default">
              <td
                colspan="8"
                class="px-4 py-6 text-center text-muted"
              >
                No users available.
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="(user, index) in users"
              :key="user.id"
              class="group border-b border-default last:border-b-0 hover:bg-muted/50"
            >
              <td class="px-4 py-3 text-muted">
                {{ index + 1 }}
              </td>

              <td class="px-4 py-3 font-medium text-highlighted">
                {{ user.full_name }}
              </td>

              <td class="px-4 py-3 text-muted">
                {{ user.email }}
              </td>

              <td class="px-4 py-3 text-muted">
                {{ user.username }}
              </td>

              <td class="px-4 py-3">
                <UBadge
                  :color="user.role === UserRole.SUPERADMIN ? 'primary' : user.role === UserRole.ADMIN ? 'warning' : 'neutral'"
                  variant="subtle"
                  class="rounded-xs"
                >
                  {{ roleLabel(user.role) }}
                </UBadge>
              </td>

              <td class="px-4 py-3">
                <UBadge
                  :color="user.status === UserStatus.ACTIVE ? 'success' : 'neutral'"
                  variant="subtle"
                  class="rounded-xs"
                >
                  {{ statusLabel(user.status) }}
                </UBadge>
              </td>

              <td class="px-4 py-3 text-muted">
                {{ user.created_at ? new Date(user.created_at).toLocaleString() : '-' }}
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
                          @click="openEditModal(user)"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          class="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-sm text-error hover:bg-error/10 disabled:opacity-50"
                          :disabled="isDeleting"
                          @click="handleDelete(user)"
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
