<script setup lang="ts">
defineOptions({
  name: 'ConfirmDialog'
})

const props = withDefaults(
  defineProps<{
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirmed?: () => Promise<unknown> | unknown
  }>(),
  {
    title: 'Confirm',
    confirmText: 'Yes',
    cancelText: 'Cancel'
  }
)

const emit = defineEmits<{
  close: [boolean]
}>()

const { handleError } = useErrorHandler()
const isLoading = ref(false)

const handleConfirm = async () => {
  if (typeof props.onConfirmed === 'function') {
    try {
      isLoading.value = true
      await props.onConfirmed()
      emit('close', true)
    } catch (error) {
      console.error('Confirmdialog action failed:', error)
      handleError(error)
      emit('close', false)
    } finally {
      isLoading.value = false
    }
    return
  }

  emit('close', true)
}
</script>

<template>
  <UModal
    :title="title"
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ content: 'rounded-xs' }"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ message }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-xs"
          :disabled="isLoading"
          @click="() => { if (!isLoading) emit('close', false) }"
        >
          {{ cancelText }}
        </UButton>
        <UButton
          color="primary"
          class="rounded-xs"
          :loading="isLoading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
