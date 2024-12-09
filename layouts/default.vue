<script lang="ts" setup>
const $saveData = useSaveData()
</script>

<template>
  <header class="sticky top-0 left-0 w-screen h-[58px] z-50 bg-neutral-900/50 backdrop-blur">
    <div class="w-full h-full flex items-center border-b border-gray-500/30">
      <Container class="flex-1 flex justify-between items-center">
        <UButton
          to="/"
          class="text-2xl font-bold"
          variant="ghost"
          icon="ph:triangle-dashed-duotone"
        >
          EduQuestAI
        </UButton>
        <div class="flex gap-4">
          <UDropdownMenu
            :items="[
              {
                label: 'Import Data',
                icon: 'ph:download-duotone'
              },
              {
                label: 'Export Data',
                icon: 'ph:upload-duotone'
              },
              {
                label: 'Reset Data',
                icon: 'ph:arrows-counter-clockwise-duotone',
                onSelect: () => {
                  $saveData.reset()
                  navigateTo('/')
                }
              },
            ]"
            :content="{
              align: 'end'
            }"
          >
            <UButton
              :label="$saveData.data.user.name"
              icon="ph:user-duotone"
              color="neutral"
              variant="outline"
            />
          </UDropdownMenu>
        </div>
      </Container>
    </div>
  </header>

  <div class="w-full flex flex-col overflow-x-hidden min-h-[calc(100vh-58px)]">
    <main class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </main>

    <footer class="flex items-center justify-center h-[36px] border-t border-gray-500/30">
      <Container>
        <p class="text-sm text-gray-500">
          © 2024 EduQuestAI. All rights reserved.
        </p>
      </Container>
    </footer>
  </div>
</template>