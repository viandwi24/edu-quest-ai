<script lang="ts" setup>
const $route = useRoute()
const $saveData = useSaveData()

const topicId = computed(() => $route.params.id)
const topic = computed(() => $saveData.data.topics.find((topic) => topic.id === topicId.value))

const menus = computed(() => [
  { type: 'item', label: 'Overview', icon: 'ph:house-duotone', to: `/topic/${topicId.value}`, primary: true },
  { type: 'item', label: 'Topic', icon: 'ph:books-duotone', to: `/topic/${topicId.value}/topic` },
  { type: 'header', label: 'Features' },
  { type: 'item', label: 'Learn', icon: 'ph:book-open-user-duotone', to: `/topic/${topicId.value}/learn` },
  { type: 'item', label: 'Quiz', icon: 'ph:note-pencil-duotone', to: `/topic/${topicId.value}/quiz` },
  { type: 'header', label: 'Options' },
  { type: 'item', label: 'Setup', icon: 'ph:wrench-duotone', to: `/topic/${topicId.value}/setup` },
  { type: 'item', label: 'Settings', icon: 'ph:gear-duotone', to: `/topic/${topicId.value}/settings` },
])

const isCurrentMenuActive = ((item: any) => {
  // return ($url.pathname.value == item.to) || $route.path === item.to;
  // const r1 = $router.currentRoute.value.path == item.to;

  // search
  const s = menus.value.filter((menu) => {
    if (!menu.to) return false
    return $route.path.startsWith(menu.to) && menu.to.startsWith(item.to)
  })
  if (s.length == 1) return true
  if (s.length > 1) {
    const r = s.find((menu) => menu.primary !== true && $route.path == item.to)
    if (r) return true
  }
  
  return false
})


onMounted(() => {
  if (topicId.value && !topic.value) return navigateTo('')
})
</script>

<template>
  <Container class="flex-1 flex py-4 gap-6">
    <div class="w-full max-w-[200px] flex flex-col gap-0.5">
      <template
        v-for="menu in menus"
        :key="menu.to"
      >
        <UButton
          v-if="menu.type === 'item'"
          :to="menu.to"
          :icon="menu.icon"
          :label="menu.label"
          class="w-auto"
          :variant="isCurrentMenuActive(menu) ? 'soft' : `ghost`"
        />
        <div v-if="menu.type === 'header'" class="text-gray-500 font-semibold mt-6 mb-2">{{ menu.label }}</div>
      </template>
    </div>
    <div class="w-full flex flex-col max-w-[calc(100%-200px)]">
      <NuxtPage v-if="topic" :topic="topic" />
    </div>
  </Container>
</template>