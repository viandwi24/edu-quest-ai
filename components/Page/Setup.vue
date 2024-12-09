<script lang="ts" setup>
import { z, ZodError } from 'zod'
import type { FormSubmitEvent } from '#ui/types'


const props = defineProps<{
  initiated?: boolean
}>()

const toast = useToast()
const $saveData = useSaveData()
const $ai = useAI()

// models
const models = computed(() => $ai.getModels())

const form = useTemplateRef('form')
const schema = z.object({
  name: z.string().min(3).max(255),
  model: z.object({
    label: z.string(),
    value: z.string(),
  }),
})

const selectedModel = computed(() => state.model?.value ? $ai.getModel(state.model.value) : undefined)

type Schema = z.output<typeof schema>


const updateStateModelFromSaveData = () => {
  const _model = models.value.find(m => m.metadata.id == $saveData.data.settings['model'])
  return _model ? { label: _model.metadata.name, value: _model.metadata.id } : undefined
}

const state = reactive<Partial<Schema>>({
  name: $saveData.data.user.name || 'Guest',
  model: updateStateModelFromSaveData() || undefined,
})

watch(models, (value) => {
  state.model = updateStateModelFromSaveData()
})


const stateModel = reactive({})
const stateModelError = reactive<Record<string, string>>({})
const updateSettingsSchema = (value: ReturnType<typeof $ai.getModel>) => {
  for (const item of value?.settingSchema || []) {
    if (typeof (stateModel as any)[item.key] == 'undefined') {
      (stateModel as any)[item.key] = $saveData.data.settings[item.key] || null
    } else {
      (stateModel as any)[item.key] = $saveData.data.settings[item.key]
    }
  }
}
watch(selectedModel, (value) => {
  if (value) {
    updateSettingsSchema(value)
  }
})
onMounted(() => {
  updateSettingsSchema(selectedModel.value)
})

async function onSubmit(event: FormSubmitEvent<Schema>) {  
  const data: Schema & {
    options: Record<string, any>
  } = {
    name: event.data.name,
    model: event.data.model,
    options: {}
  }

  for (const item of selectedModel.value?.settingSchema || []) {
    try {
      delete stateModelError[item.key]
      const parsed = item.schema.parse((stateModel as any)[item.key])
      data.options[item.key] = parsed
    } catch (error) {
      if (error instanceof ZodError) {
        stateModelError[item.key] = error.errors[0].message
        return
      }
    }
  }


  $saveData.data.user.name = data.name
  $saveData.data.user.name = data.name
  $saveData.data.settings = {
    ...data.options,
    model: data.model.value,
  }
  // toast.add({ title: 'Success', description: 'Data saved.', color: 'success' })
  console.log('data', $saveData.data)
  $saveData.save()
  if (!props.initiated) {
    $saveData.changePage('project')
  }
  $ai.reload()
}
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
          <UIcon name="ph:pipe-wrench-duotone" />
          <h1 class="font-semibold">
            Setup
          </h1>
        </div>
        <div class="flex items-center gap-2">
        </div>
      </div>
    </template>

    <div class="flex-1 flex flex-col justify-center items-center gap-4">
      <UForm ref="form" :schema="schema" :state="state" class="space-y-4 w-[300px]" @submit="onSubmit">
        <UFormField
          label="Name"
          name="name"
          description="AI will call you by this name."
        >
          <UInput v-model="state.name"  class="w-full" />
        </UFormField>
        <UFormField
          label="Model"
          name="model"
          description="Choose the model that you want to use."
        >
          <USelectMenu
            v-model="state.model"
            :items="models.map((model) => ({ label: model.metadata.name, value: model.metadata.id }) as any)"
            class="w-full"
          />
        </UFormField>
      </UForm>

      <UForm v-if="selectedModel" :state="stateModel" class="space-y-4 w-[300px]">
        <UFormField
          v-for="field in selectedModel.settingSchema"
          :label="field.name"
          :name="field.key"
          :description="field.description"
          :error="stateModelError[field.key]"
        >
          <UInput v-if="field.input == 'text'" v-model="(stateModel as any)[field.key]" class="w-full" />
        </UFormField>
      </UForm>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          v-if="!props.initiated"
          label="Back"
          variant="outline"
          @click="$saveData.changePage('home')"
        />
        <UButton
          :label="props.initiated ? 'Save' : 'Next'"
          variant="solid"
          @click="form?.submit()"
        />
      </div>
    </template>
  </UCard>
</template>