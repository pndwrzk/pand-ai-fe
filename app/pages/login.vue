<script setup lang="ts">
import { z } from 'zod'
import { appLogin, setAuthToken } from '~/services/auth'

definePageMeta({
  layout: false
})

const { handleError } = useErrorHandler()

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters long.')
})

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const formErrors = ref({
  email: '',
  password: ''
})

const validateForm = () => {
  const result = loginSchema.safeParse({
    email: email.value,
    password: password.value
  })

  formErrors.value = {
    email: result.success ? '' : result.error.flatten().fieldErrors.email?.[0] ?? '',
    password: result.success ? '' : result.error.flatten().fieldErrors.password?.[0] ?? ''
  }

  return result.success
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  const payload = {
    email: email.value.trim(),
    password: password.value.trim()
  }

  isLoading.value = true

  try {
    const response = await appLogin(payload)
    const accessToken = response?.data?.access_token

    if (!accessToken) {
      throw new Error('Access token not found in app login response')
    }

    setAuthToken(accessToken, response.data.token_type || 'Bearer', 'app')
    await navigateTo('/')
  } catch (error) {
    console.error('App login failed:', error)
    handleError(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
    <div class="w-full max-w-md rounded-xs border border-default bg-default p-6 shadow-lg shadow-default/10">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xs bg-primary/10 text-primary">
          <UIcon name="i-lucide-shield-check" class="h-7 w-7" />
        </div>

        <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Dashboard Access
        </p>
        <h1 class="mt-2 text-2xl font-bold text-highlighted">
          Sign in to Pand AI
        </h1>
      </div>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-highlighted">Email</label>
          <UInput
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            icon="i-lucide-mail"
            size="lg"
            class="w-full"
            :class="formErrors.email ? 'border-error' : ''"
            @blur="validateForm"
          />
          <p v-if="formErrors.email" class="text-xs text-error">
            {{ formErrors.email }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-highlighted">Password</label>

          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            icon="i-lucide-lock"
            size="lg"
            class="w-full"
            :class="formErrors.password ? 'border-error' : ''"
            @blur="validateForm"
          />
          <p v-if="formErrors.password" class="text-xs text-error">
            {{ formErrors.password }}
          </p>
        </div>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full justify-center"
          :loading="isLoading"
        >
          {{ isLoading ? 'Processing...' : 'Sign in' }}
        </UButton>
      </form>
    </div>
  </div>
</template>
