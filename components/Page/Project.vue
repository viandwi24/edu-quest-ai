<script lang="ts" setup>
import { z } from 'zod'
import { ModalAsk } from '#components';

const $saveData = useSaveData()
const modal = useModal()

const newTopic = () => {
  modal.open(ModalAsk, {
    modalOptions: {
      title: 'New Learning Topic',
      text: 'Create a new learning topic',
      primaryLabel: 'Create',

      inputs: [
        { key: 'name', label: 'Name', type: 'text', schema: z.string().min(1, 'Name is required') },
      ]
    },
    async onPrimaryAction (input: any) {
      modal.close()
      $saveData.createTopic(input.name)
    },
    onSecondaryAction: modal.close,
  })
}
</script>

<template>
  <Container class="flex-1 flex flex-col justify-center py-4 overflow-hidden max-h-[calc(100vh-58px-36px)]">
    <UCard
      :ui="{
        root: 'flex-1 flex flex-col overflow-hidden rounded',
        body: 'flex-1 flex flex-col overflow-y-auto',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-lg">
            <UIcon name="ph:app-window-duotone" />
            <h1 class="font-bold">Topic List</h1>
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-4">
        <NuxtLink
          v-for="topic in $saveData.data.topics"
          :key="topic.id"
          class="px-4 py-2 rounded bg-neutral-500/5 border border-neutral-500/10 flex justify-between cursor-pointer"
          :to="{ name: 'topic-id', params: { id: topic.id } }"
        >
          <div class="flex flex-col">
            <div class="font-semibold">{{ topic.name }}</div>
            <div class="text-sm text-gray-500">{{ topic.id }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">{{ topic.timestamp }}</div>
          </div>
        </NuxtLink>
        <div v-if="$saveData.data.topics.length === 0" class="text-center text-gray-500">No topic found</div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            icon="ph:plus-circle-duotone"
            label="New Topic"
            variant="solid"
            @click="newTopic"
          />
        </div>
      </template>
    </UCard>
  </Container>
</template>