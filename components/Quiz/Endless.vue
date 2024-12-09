<script lang="ts" setup>
const props = defineProps<{
  topic: SaveDataTopic
  quiz: SaveDataQuiz
}>()
</script>

<template>
  <UCard
    :ui="{
      root: 'flex-1 flex flex-col overflow-hidden rounded',
      body: 'flex-1 flex flex-col overflow-y-auto',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="ph:note-pencil-duotone" />
          <h1 class="font-semibold capitalize">
            Quiz Endless
          </h1>
        </div>
        <div class="flex items-center gap-2">
        </div>
      </div>
    </template>
  </UCard>
</template>