<script lang="ts" setup>
import { z } from 'zod'

const $route = useRoute()
const $saveData = useSaveData()
const $ai = useAI()

const topicId = computed(() => $route.params.id)
const topic = computed(() => $saveData.data.topics.find((topic) => topic.id === topicId.value))
const model = computed(() => $ai.getModel($saveData.data.settings['model']))

const widgets = reactive([
  {
    title: 'Define Learning Topic',
    icon: 'ph:book-duotone',
    color: 'primary',
    to:`/topic/${topicId.value}/learn`,
    description: 'Tell the AI about what you want to learn',
  },
  {
    title: 'Interactive Quiz',
    icon: 'ph:pen-duotone',
    color: 'primary',
    to: '/',
    description: 'Interactive quiz to test your knowledge',
  },
])


// ai
const aiComponent = useTemplateRef('ai-component')
const AiSuggestionActionsSchema = z.array(z.object({
  action: z.string(),
  params: z.union([
    z.object({
      reason: z.string(),
    }),
    z.object({}),
    z.any({}),
  ])
}))
const aiSuggestionActions = reactive<z.infer<typeof AiSuggestionActionsSchema>>([])
const generateAi = () => {
  if (!aiComponent.value || !model.value) return
  aiComponent.value.send(model.value, async (model, responseText) => {
    if (!topic.value) return

    // reset responseText
    responseText.value = ''

    // push
    topic.value.whatNexts ||= []
    const whatNext = {
      timestamp: Date.now(),
      activitiesCount: topic.value.activities.length,
      content: responseText.value,
      suggestionActions: [],
    }
    try {
      topic.value.whatNexts.push(whatNext)

      // get model
      const lc = model.getLcModel()

      // prepare
      const prompt = usePrompt().WHAT_NEXT({
        topicName: topic.value.name,
        context: {
          topic: {
            id: topic.value.id,
            name: topic.value.name,
          },
          user: {
            ...$saveData.data.user,
          },
        },
        outlines: topic.value.outlines || [],
        activities: topic.value.activities || [],
        schema: [],
      })

      // start stream chat
      await aiComponent.value?.stream(lc, prompt)

      // parse response
      // Ekstrak JSON dari output
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const matchedJson = responseText.value.match(jsonRegex);
      console.log("Matched JSON:", matchedJson);

      let actions = null;
      if (matchedJson && matchedJson[1]) {
        console.log("Matched JSON (Raw):", matchedJson[1]); // Debugging blok JSON

        // Membersihkan JSON sebelum parsing
        const cleanedJson = matchedJson[1].trim().replace(/\s+$/, ""); // Trim spasi dan baris kosong
        console.log("Matched JSON (Cleaned):", cleanedJson);

        try {
          actions = JSON.parse(cleanedJson); // Parsing JSON
        } catch (error) {
          console.error("Gagal parse JSON:", error);
        }
      } else {
        console.log("Tidak ada JSON yang cocok.");
      }

      whatNext.content = responseText.value
      console.log("Output AI:", responseText.value);
      console.log("Actions:", actions);

      if (actions) {
        try {
          // Parse actions
          const _data = AiSuggestionActionsSchema.parse(actions)
          // add to aiSuggestionActions
          aiSuggestionActions.splice(0, aiSuggestionActions.length, ..._data)
          whatNext.suggestionActions = _data as any

          if (whatNext.content.trim() == '') {
            throw new Error('Empty response')
          }

          // save data
          $saveData.save()
        } catch (error) {
          // warning
          console.error('Failed to parse actions', error)
          // reset aiSuggestionActions
          aiSuggestionActions.splice(0, aiSuggestionActions.length)

          // remove suggestionActions
          topic.value.whatNexts.splice(topic.value.whatNexts.indexOf(whatNext), 1)

          throw error
        }
      }
    } catch (error) {
      // remove
      topic.value.whatNexts.splice(topic.value.whatNexts.indexOf(whatNext), 1)

      // 
      console.error('Failed to generate AI', error)
    }
  })
}
onMounted(() => {
  nextTick(() => {
    const lastWhatNext = topic.value?.whatNexts?.[topic.value.whatNexts.length - 1]
    const activitiesCount = topic.value?.activities?.length || 0

    // validate
    // console.log('validate generateAi', lastWhatNext?.activitiesCount, JSON.parse(JSON.stringify(lastWhatNext)), activitiesCount)
    if (!lastWhatNext) return generateAi()
    if (lastWhatNext.activitiesCount != activitiesCount) return generateAi()

    // get last response
    try {
      const _aiSuggestionActions = AiSuggestionActionsSchema.parse(lastWhatNext.suggestionActions)
      aiSuggestionActions.splice(0, aiSuggestionActions.length, ..._aiSuggestionActions)
      if (aiComponent.value) aiComponent.value.setContent(lastWhatNext.content)
    } catch (error) {
      console.error('Failed to parse aiSuggestionActions', error)
    }
  })
  // generateAi()
})

const parseSuggestionActions = (item: z.infer<typeof AiSuggestionActionsSchema>[0]) => {
  switch (item.action) {
    case 'quiz_baseline':
      return {
        title: 'Quiz Baseline',
        icon: 'ph:note-pencil-duotone',
        click: () => navigateTo(`/topic/${topicId.value}/quiz`),
      }
    case 'quiz_endless':
      return {
        title: 'Quiz Endless',
        icon: 'ph:note-pencil-duotone',
        click: () => navigateTo(`/topic/${topicId.value}/quiz/endless`),
      }
    case 'outline_generate':
      return {
        title: 'Generate Outline',
        icon: 'ph:book-open-duotone',
        click: () => navigateTo(`/topic/${topicId.value}/topic`),
      }
  }

  return {
    click: () => {},
    icon: 'ph:circle-duotone',
  }
}
</script>

<template>
  <!-- <UCard
    v-if="topic"
    :ui="{
    }"
  >
    <template #header>fIterableReadableStream
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-lg">
          <UIcon name="ph:house-duotone" />
          <h1 class="font-bold">
            Overview: {{ topic.name }}
          </h1>
        </div>
      </div>
    </template>
  </UCard> -->

  <div class="flex flex-col gap-4">
    <!-- <div>{{ topic?.whatNexts }}</div> -->
    <!-- title -->
    <div>
      <div class="inline-flex items-center gap-2 border-b border-gray-500/30 pb-2">
        <UIcon name="ph:circle-duotone" class="text-2xl" />
        <h1 class="text-3xl font-semibold">
          {{ topic?.name || 'Loading...' }}
        </h1>
      </div>
    </div>

    <!-- shorcuts -->
    <div class="text-xl flex items-center gap-1 font-semibold border-b border-gray-500/30 mt-6 pb-2">
      <UIcon name="ph:hash-straight-duotone" />
      <h2>Shortcuts</h2>
    </div>
    <div class="grid grid-cols-4 gap-4">
      <NuxtLink
        v-for="(item, i) in widgets"
        :key="i"
        :to="item.to"
      >
        <div class="border cursor-pointer text-left border-gray-500/30 hover:bg-gray-500/10 dark:hover:bg-gray-500/30 flex flex-col rounded-lg p-4">
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
        </div>
      </NuxtLink>
    </div>

    <!-- ai -->
    <div class="text-xl flex items-center gap-1 font-semibold border-b border-gray-500/30 mt-6 pb-2">
      <UIcon name="ph:hash-straight-duotone" />
      <h2>AI</h2>
    </div>
    <AIResponse v-if="topic" ref="ai-component" title="Whats Next?" @stream-finish="(...e) => topic && topicAiResponseOnStreamFinish('whatnext_generate', topic)(...e)">
      <template #action="{ isLoading, responseText }">
        <div v-if="!isLoading && responseText.trim() != ''" class="flex justify-end gap-2">
          <UTooltip
            text="Regenerate AI response"
            :delay-duration="0"
            :content="{
              align: 'end',
              side: 'left'
            }"
          >
            <UButton
              size="xs"
              icon="ph:arrows-clockwise-duotone"
              @click="generateAi"
            />
          </UTooltip>
        </div>
      </template>
      <template v-if="aiSuggestionActions.length > 0" #content>
        <div class="border-t border-gray-500/30 dark:border-gray-500/30 mt-6" />
        <h2 class="text-2xl font-semibold mt-4">
          Sugesti Aksi 
        </h2>
        <div class="mt-4 max-w-full overflow-y-auto flex gap-4">
          <template
            v-for="(item, i) in aiSuggestionActions"
            :key="i"
          >
            <button
              class="max-w-[400px] border cursor-pointer text-left border-gray-500/30 hover:bg-gray-500/10 dark:hover:bg-gray-500/30 flex rounded-lg p-4 gap-2"
              @click="parseSuggestionActions(item)?.click"
            >
              <div class="flex flex-col">
                <div class="p-2 flex justify-center items-center rounded-lg bg-primary-500/20">
                  <UIcon
                    :name="parseSuggestionActions(item)?.icon || ''"
                    class="text-primary-500"
                  />
                </div>
              </div>
              <div class="">
                <div class="font-semibold capitalize">{{ parseSuggestionActions(item)?.title }}</div>
                <div class="text-sm text-gray-950 dark:text-white">
                  {{ item.params.reason }}
                </div>
              </div>
            </button>
          </template>
        </div>
      </template>
    </AIResponse>
  </div>
</template>