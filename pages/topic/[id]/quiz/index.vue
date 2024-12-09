<script lang="ts" setup>
import { v7 as uuidv7 } from 'uuid'
import dayjs from 'dayjs'

const $route = useRoute()
const $saveData = useSaveData()
const topicId = computed(() => $route.params.id)
const topic = computed(() => $saveData.data.topics.find((topic) => topic.id === topicId.value))

const widgets = reactive([
  {
    title: 'Baseline Quiz',
    mode: 'baseline',
    icon: 'ph:pen-duotone',
    color: 'primary',
    description: 'Short quiz with general questions about the topic to test your first knowledge',
  },
  {
    title: 'Endless Quiz',
    mode: 'endless',
    icon: 'ph:book-duotone',
    color: 'primary',
    description: 'Endless quiz with random questions about the topic',
  },
])

const createQuiz = (item: { mode: string }) => {
  if (!topic.value) return
  
  const alloweds = ['baseline', 'endless']
  if (!alloweds.includes(item.mode)) return

  const _item = {
    id: uuidv7(),
    mode: item.mode,
    params: {},
    questions: [],
    timestamp: Date.now(),
  }
  topic.value.quizzes.push(_item)
  $saveData.save()

  // navigate
  if (_item.id) navigateTo(`/topic/${$route.params.id}/quiz/${_item.id}`)
}
</script>

<template>  
  <div class="flex flex-col gap-4">
    <div>
      <div class="inline-flex items-center gap-2 border-b border-gray-500/30 pb-2">
        <UIcon name="ph:circle-duotone" class="text-2xl" />
        <h1 class="text-3xl font-semibold">
          Quiz
        </h1>
      </div>
    </div>


    <!-- shorcuts -->
    <div class="text-xl flex items-center gap-1 font-semibold border-b border-gray-500/30 mt-6 pb-2">
      <UIcon name="ph:hash-straight-duotone" />
      <h2>Start</h2>
    </div>
    <div class="grid grid-cols-4 gap-4">
      <button
        v-for="(item, i) in widgets"
        :key="i"
        class="border cursor-pointer text-left border-gray-500/30 hover:bg-gray-500/10 dark:hover:bg-gray-500/30 flex flex-col rounded-lg p-4"
        @click="() => createQuiz(item)"
      >
        <div class="flex">
          <div class="p-2 flex justify-center items-center rounded-lg bg-primary-500/20">
            <UIcon
              :name="item.icon"
              :class="{
                'text-primary-500': item.color === 'primary',
              }"
            />
          </div>
        </div>
        <div class="mt-2">
          <div class="font-semibold">{{ item.title }}</div>
          <div class="text-sm text-gray-950 dark:text-white">
            {{ item.description }}
          </div>
          <div
            class="mt-1 text-xs flex gap-2 items-center"
            :class="{
              'text-primary-500': item.color === 'primary',
            }"
          >
            <span>Start</span>
            <UIcon name="ph:arrow-right" class="" />
          </div>
        </div>
      </button>
    </div>


    <!-- hstory -->
    <div class="text-xl flex items-center gap-1 font-semibold border-b border-gray-500/30 mt-6 pb-2">
      <UIcon name="ph:hash-straight-duotone" />
      <h2>History</h2>
    </div>
    <div class="grid grid-cols-1 gap-2">
      <NuxtLink
        v-for="(item, i) in topic?.quizzes?.sort((a, b) => b.timestamp - a.timestamp)"
        :key="i"
        class="border cursor-pointer text-left border-gray-500/30 hover:bg-gray-500/10 dark:hover:bg-gray-500/30 flex flex-col rounded-lg p-4"
        :to="`/topic/${$route.params.id}/quiz/${item.id}`"
      >
        <div class="flex items-center gap-2">
          <div class="p-2 flex justify-center items-center rounded-lg bg-primary-500/20">
            <UIcon
              name="ph:pen-duotone"
              class="text-primary-500"
            />
          </div>
          <div class="font-semibold text-lg capitalize">
            {{ item.mode }}
          </div>
        </div>
        <div class="mt-2">
          <div class="text-sm flex items-center gap-1">
            Created at
            <UIcon name="ph:clock" class="text-gray-500" /> {{ dayjs(item.timestamp).format('DD/MM/YYYY HH:mm') }}
          </div>
          <div v-if="item.finishTimestamp" class="text-sm flex items-center gap-1">
            <span class="text-green-500">Finished at</span>
            <UIcon name="ph:clock" class="text-gray-500" /> {{ dayjs(item.finishTimestamp).format('DD/MM/YYYY HH:mm') }}
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>