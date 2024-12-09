<script lang="ts" setup>
import { z } from 'zod'

const $route = useRoute()
const $saveData = useSaveData()
const $ai = useAI()

const topicId = computed(() => $route.params.id)
const topic = computed(() => $saveData.data.topics.find((topic) => topic.id === topicId.value))
const model = computed(() => $ai.getModel($saveData.data.settings['model']))


// action::learn topic
const learnTopicAiComponent = useTemplateRef('learn-topic-ai-component')
const $learnTopic = (() => {
  const isEditing = ref(false)
  const content = ref(topic.value?.learnTopic || '')
  const isGenerating = ref(false)
  const regenerated = ref(false)

  watch(topic, () => {
    content.value = topic.value?.learnTopic || ''
  })

  const edit = () => {
    isEditing.value = true
  }
  const save = () => {
    isEditing.value = false

    // if content is empty
    if (content.value.trim() == '') return

    // lets summarize the content
    isGenerating.value = true
    nextTick(() => {
      if (!learnTopicAiComponent.value || !model.value) return
      learnTopicAiComponent.value.send(model.value, async (model, responseText) => {
        if (!topic.value) return

        regenerated.value = false
        responseText.value = ''

        // prepare
        const prompt = usePrompt().LEARNTOPIC_SUMMARIZE({
          context: {
            topic: {
              name: topic.value.name,
            }
          },
          content: content.value,
        })

        // get models
        const lc = model.getLcModel()
        
        // start stream chat
        await learnTopicAiComponent.value?.stream(lc, prompt)

        // done
        regenerated.value = true
        content.value = responseText.value
        topic.value.learnTopic = content.value
        topic.value.activities.push({
          action: 'set_learning_topic',
          description: 'User set learning topic',
          timestamp: Date.now(),
          data: {}
        })
        $saveData.save()
        isGenerating.value = false
      })
    })
  }

  const onKeyPress = (event: KeyboardEvent) => {
    if ((event.key === 'Enter' && event.ctrlKey) || (event.key === 'Enter' && event.metaKey)) {
      save()
    }
  }

  return {
    isEditing,
    isGenerating,
    regenerated,

    content,

    edit,
    save,
    onKeyPress,
  }
})();

// action::outline
const outlineAiComponent = useTemplateRef('outline-ai-component')
const $outline = (() => {
  const isGenerating = ref(false)
  const outlines = ref(topic.value?.outlines || null)

  watch(topic, () => {
    outlines.value = topic.value?.outlines || null
  })

  const generate = () => {
    if (!topic.value || !topic.value.learnTopic || topic.value.learnTopic.trim() == '') return

    isGenerating.value = true
    nextTick(() => {
      if (!outlineAiComponent.value || !model.value) return
      outlineAiComponent.value.send(model.value, async (model, responseText) => {
        if (!topic.value) return

        responseText.value = ''

        // prepare
        const prompt = usePrompt().OUTLINE({
          context: {
            topic: {
              name: topic.value.name,
            }
          },
          learnTopic: topic.value.learnTopic,
        })

        // get models
        const lc = model.getLcModel()
        
        // start stream chat
        await outlineAiComponent.value?.stream(lc, prompt)

        // parse response
        // Ekstrak JSON dari output
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const matchedJson = responseText.value.match(jsonRegex);

        let _outlines = null;
        if (matchedJson && matchedJson[1]) {
          const cleanedJson = matchedJson[1].trim().replace(/\s+$/, "");
          try {
            _outlines = JSON.parse(cleanedJson);
          } catch (error) {
            console.error("Gagal parse JSON:", error);
          }
        } else {
          console.log("Tidak ada JSON yang cocok.");
        }

        // done
        topic.value.outlines = _outlines
        topic.value.activities.push({
          action: 'outline_generate',
          description: 'Generated outline based on learning topic',
          timestamp: Date.now(),
          data: {}
        })
        outlines.value = _outlines
        $saveData.save()
        isGenerating.value = false
      })
    })
  }

  watch($learnTopic.content, () => {
    if (!$learnTopic.regenerated.value) return
    generate()
  })

  return {
    isGenerating,
    outlines,
    generate,
  }
})();
</script>

<template>
  <div class="flex flex-col w-full gap-6">
    <!-- title -->
    <div>
      <div class="inline-flex items-center gap-2 border-b border-gray-500/30 pb-2">
        <UIcon name="ph:circle-duotone" class="text-2xl" />
        <h1 class="text-3xl font-semibold">
          Topic
        </h1>
      </div>
    </div>

    <!-- topic -->
    <div class="text-xl flex items-center gap-1 font-semibold border-b border-gray-500/30 mt-6 pb-2">
      <UIcon name="ph:hash-straight-duotone" />
      <h2>Knowledges</h2>
    </div>
    <UCard
      :ui="{
        body: 'p-0 sm:p-0 pb-0',
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
            <UTooltip
              v-if="$learnTopic.isEditing.value"
              text="Update / Save Topic"
              :delay-duration="0"
              :content="{
                align: 'end',
                side: 'left'
              }"
            >
              <UButton
                size="xs"
                icon="ph:floppy-disk-duotone"
                @click="$learnTopic.save()"
              />
            </UTooltip>
            <UTooltip
              v-if="!$learnTopic.isEditing.value"
              text="Edit Topic"
              :delay-duration="0"
              :content="{
                align: 'end',
                side: 'left'
              }"
            >
              <UButton
                size="xs"
                icon="ph:pen-duotone"
                @click="$learnTopic.edit()"
              />
            </UTooltip>
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500">
            Describe the topic you are learning about, or all the notes you have taken.
            ai will use this information to generate a summary and outline.
          </p>
        </div>
      </template>

      <div>
        <textarea
          v-if="$learnTopic.isEditing.value"
          class="w-full rounded-lg p-4 outline-none text-sm"
          rows="5"
          placeholder="Type your notes here... (ctrl+enter or cmd+enter to save)"
          v-model="$learnTopic.content.value"
          @keypress="$learnTopic.onKeyPress($event)"
        ></textarea>
        <div v-else-if="$learnTopic.content.value.trim() != ''" class="p-4">
          {{ $learnTopic.content.value }}
        </div>
        <div v-else class="p-4">
          <UAlert
            title="No learning topic content"
            description="Learning topic is required because ai will use this information to generate a summary and outline, please add content with click on the edit button in the right corner."
            icon="ph:warning-duotone"
            variant="soft"
          />
        </div>
        <div v-if="$learnTopic.isGenerating.value" class="p-4">
          <AIResponse ref="learn-topic-ai-component" title="AI" @stream-finish="(...e) => topic && topicAiResponseOnStreamFinish('learntopic_summarize', topic)(...e)">
          </AIResponse>
        </div>
      </div>
    </UCard>

    <!-- outlines -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="ph:chat-circle-dots-duotone" />
            <h1 class="font-semibold">
              Outline
            </h1>
          </div>
          <div class="flex items-center gap-2">
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
                @click="$outline.generate()"
              />
            </UTooltip>
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500">
            This outline is generated by ai based on the learning topic you have written.
          </p>
        </div>
      </template>

      <AIResponse v-if="$outline.isGenerating.value" ref="outline-ai-component" title="AI" @stream-finish="(...e) => topic && topicAiResponseOnStreamFinish('outline_generate', topic)(...e)">
      </AIResponse>
      <div v-else-if="!$outline.isGenerating.value && $outline.outlines.value && $outline.outlines.value.length > 0">
        <NestedComponent
          v-for="(outline, i) in $outline.outlines.value || []"
          :key="i"
          :as="'div'"
          :content="outline.content"
          :children="(outline.children || [])"
          :depth="0"
          :indexs="[i]"
        >
          <template #default="{ content, indexs, depth }">
            <div
              :style="{ paddingLeft: `${depth * 20}px` }"
            >
              <span class="pr-2">{{ indexs.map(i => i+1).join('.') }}.</span>
              <span>{{ content }}</span>
            </div>
          </template>
        </NestedComponent>
      </div>
      <div v-else>
        <UAlert
          title="No outline content"
          description="Outline will be generated by ai based on the learning topic you have written, please add learning topic content first."
          icon="ph:warning-duotone"
          variant="soft"
        />
      </div>
    </UCard>
  </div>
</template>