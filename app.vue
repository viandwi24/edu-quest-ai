<script lang="ts" setup>
const $saveData = useSaveData()
const $ai = useAI()
onMounted(() => {
  $saveData.load()
  $ai.load()
})
</script>

<template>
  <Body class="overflow-x-hidden">
    <UApp>
      <NuxtRouteAnnouncer />
      <!-- <NuxtWelcome /> -->
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </Body>
</template>
