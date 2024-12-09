<script lang="ts" setup>
const $route = useRoute()
const $saveData = useSaveData()
const $ai = useAI()

const topicId = computed(() => $route.params.id)
const topic = computed(() => $saveData.data.topics.find((topic) => topic.id === topicId.value))
const text = ref(JSON.parse(JSON.stringify(topic.value)))
watch(text, () => {
  text.value = JSON.parse(JSON.stringify(topic.value))
}, { deep: true })
</script>

<template>
  <UCard
    :ui="{
      root: 'flex-1 flex flex-col overflow-hidden rounded',
      body: 'flex-1 flex flex-col overflow-y-auto p-0 sm:p-0',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="ph:chat-circle-dots-duotone" />
          <h1 class="font-semibold">
            Learning Topic
          </h1>
        </div>
        <div class="flex items-center gap-2">
        </div>
      </div>
    </template>
    <json-editor
      mode="tree"
      height="100%"
      v-model="text"
      class="flex-1 overflow-hidden"
    />
  </UCard>
</template>