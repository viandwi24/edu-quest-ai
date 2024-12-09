<script lang="ts" setup>
import { z } from 'zod'

const props = defineProps<{
  modalOptions: Partial<{
    primaryLabel: string
    secondaryLabel: string
    title: string
    text: string

    inputs: {
      label: string
      key: string
      type: 'text' | 'password' | 'email'
      // zod
      schema: z.ZodType<any, any, any>,
      initialValue?: any
    }[]
  }>
}>();

const modal = useModal()
const emit = defineEmits(['primaryAction', 'secondaryAction'])

const shr = defineShortcuts({
  escape: {
    usingInput: true,
    handler: () => {
      modal.close()
    },
  },
  enter: {
    usingInput: true,
    handler: () => {
      primaryAction()
    },
  },
})

// input schema is object, and dynamic depending on the props inputs
// inputs[] => z.object({ [key]: schema })
const inputSchema = z.object(Object.fromEntries((props.modalOptions.inputs || []).map(input => [input.key, input.schema])))
const inputState = reactive(Object.fromEntries((props.modalOptions.inputs || []).map(input => [input.key, input.initialValue || ''])))

const secondaryAction = () => {
  emit('secondaryAction')
}
const primaryAction = () => {
  // parse
  try {
    const parsed = inputSchema.parse(inputState)
    emit('primaryAction', inputState)
  } catch (error) {
    console.error('error', error)
  }
}

onMounted(() => {
  console.log('inputSchema', {
    inputSchema,
    inputState,
  })
})
</script>

<template>
  <UModal>
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-1">
            <UIcon name="ph:question-duotone" class="text-shark-400 text-lg" />
            <h3 class="text-lg font-semibold">
              {{ modalOptions.title || 'Confirm' }}
            </h3>
          </div>
        </template>
        <div class="flex flex-col space-y-2">
          <p v-if="modalOptions.text || (!modalOptions.inputs)" class="text-gray-700 dark:text-gray-100">{{ modalOptions.text || 'Are you sure you want to proceed?' }}</p>
          <UForm :schema="inputSchema" :state="inputState" v-if="modalOptions.inputs" class="space-y-4 w-full">
            <UFormField v-for="input in modalOptions.inputs" :key="input.key" :label="input.label" :name="input.key" eager-validation>
              <UInput :type="input.type" v-model="inputState[input.key]" :placeholder="input.label" class="w-full" />
            </UFormField>
          </UForm>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton :label="modalOptions.secondaryLabel || 'Cancel'" color="error" @click="secondaryAction" />
            <UButton :label="modalOptions.primaryLabel || 'Okay'" color="primary" @click="primaryAction" />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>