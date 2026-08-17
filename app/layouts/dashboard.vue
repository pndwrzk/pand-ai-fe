<!-- app/layouts/dashboard.vue -->

<script setup lang="ts">
import { clearAuthToken } from '~/services/auth'

const { isOpen, close } = useSidebar()
const { user, isSuperAdmin, fetchUser, clearUser } = useAuthUser()

onMounted(async () => {
  await fetchUser()
})

const baseNavigation = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard'
  },
  {
    label: 'Users',
    icon: 'i-lucide-users',
    to: '/dashboard/users',
    superAdminOnly: true
  },
  {
    label: 'Modules',
    icon: 'i-lucide-box',
    to: '/dashboard/modules'
  }
]

const navigation = computed(() =>
  baseNavigation.filter(item => !item.superAdminOnly || isSuperAdmin.value)
)

const isActive = (to: string) => {
  const route = useRoute()

  if (to === '/dashboard') {
    return route.path === to
  }

  return route.path.startsWith(to)
}

const handleLogout = async () => {
  clearAuthToken('internal')
  clearUser()
  await navigateTo('/dashboard/login')
}
</script>

<template>
  <div class="min-h-screen bg-muted">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-40 bg-black/40 lg:hidden" @click="close" />
    </Transition>

    <aside class="
        fixed inset-y-0 left-0 z-50 w-64
        border-r border-default bg-default
        transition-transform duration-300
        lg:translate-x-0
      " :class="[isOpen ? 'translate-x-0' : '-translate-x-full']">
      <!-- Logo -->
      <div class="flex h-16 items-center justify-between border-b border-default px-6">
        <NuxtLink to="/dashboard" class="text-xl font-bold text-primary" @click="close">
          Pand AI
        </NuxtLink>

        <UButton icon="i-lucide-x" color="neutral" variant="ghost" class="lg:hidden" aria-label="Close sidebar"
          @click="close" />
      </div>

      <!-- Navigation -->
      <nav class="p-4">
        <div class="space-y-1">
          <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" class="
              flex items-center gap-3 rounded-xs px-3 py-2
              text-sm font-medium
              transition-colors
            " :class="isActive(item.to)
              ? 'bg-primary/10 text-primary'
              : 'text-muted hover:bg-primary/10 hover:text-primary'
              " @click="close">
            <UIcon :name="item.icon" class="size-5" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Bottom User -->
      <div class="absolute inset-x-0 bottom-0 border-t border-default bg-default p-4">
        <div class="flex items-center gap-3">
          <UAvatar src="https://i.pravatar.cc/100" :alt="user?.name ?? 'User'" />

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ user?.name ?? '...' }}
            </p>

            <p class="truncate text-xs text-muted">
              {{ user?.email ?? '' }}
            </p>
          </div>

          <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" size="sm" aria-label="More options" />
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="min-h-screen lg:pl-64">
      <!-- Dashboard Header -->
      <header class="
          sticky top-0 z-30 h-16
          border-b border-default
          bg-default/80 backdrop-blur
        ">
        <div class="flex h-full items-center justify-between px-4 sm:px-6">
          <!-- Mobile menu -->
          <UButton icon="i-lucide-menu" color="neutral" variant="ghost" class="lg:hidden" aria-label="Open sidebar"
            @click="isOpen = true" />

          <!-- Actions -->
          <div class="ml-auto flex items-center gap-1 sm:gap-2">


            <UButton icon="i-lucide-log-out" color="neutral" variant="ghost" aria-label="Logout"
              @click="handleLogout" />
          </div>
        </div>
      </header>

      <!-- Content -->
      <UMain class="min-h-[calc(100vh-4rem)] bg-muted">
        <slot />
      </UMain>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
