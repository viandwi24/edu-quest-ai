<script setup lang="ts">
const props = defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: null
  },
  filename: {
    type: String,
    default: null
  },
  highlights: {
    type: Array as () => number[],
    default: () => []
  },
  meta: {
    type: String,
    default: null
  },
  class: {
    type: String,
    default: null
  }
})

const isCopied = ref(false)
const copy = () => {
  navigator.clipboard.writeText(props.code)
    .then(() => {
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 500)
    })
    .catch((err) => {
      console.error('Failed to copy to clipboard', err)
    })
}

// use phosphor icons
const filesMappingPhIcons: {
  [key: string]: string
} = {
  'default': 'ph:code-block',
  'javascript': 'ph:file-js-duotone',
  'typescript': 'ph:file-ts-duotone',
  'bash': 'ph:terminal-window-duotone',
  'shell': 'ph:terminal-window-duotone',
  'html': 'ph:file-html-duotone',
  'cpp': 'ph:file-cpp-duotone',
  'csharp': 'ph:file-c-sharp-duotone',
  'python': 'ph:file-py-duotone',
}

const isCollapsed = ref(false)
</script>

<template>
  <div
    v-if="isCollapsed"
    class="prose-pre not-markdown-body border border-neutral-400/30 rounded my-2 overflow-hidden relative flex flex-col bg-neutral-900 w-full max-w-full"
  >
    <div class="px-4 py-2 bg-neutral-800/50 border-b border-neutral-500/30 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <UIcon
          :name="filesMappingPhIcons[language] || filesMappingPhIcons['default']"
          class="text-neutral-400"
        />
        <div class="text-gray-100">{{ language || 'plaintext' }}</div>
      </div>
      <div class="flex gap-2">
        <button @click="isCollapsed = !isCollapsed" class="text-xs flex items-center gap-1 text-neutral-400 hover:text-neutral-200">
          <UIcon name="ph:caret-circle-up-duotone" />
          <span>Hide</span>
        </button>
        <button @click="copy" class="text-xs flex items-center gap-1" :class="{ 'text-green-500': isCopied, 'text-neutral-400 hover:text-neutral-200': !isCopied }">
          <UIcon
            :name="!isCopied ? 'ph:clipboard-duotone' : 'ph:check-duotone'"
            class="text-neutral-400"
          />
          <span>{{ isCopied ? 'Copied!' : 'Copy' }}</span>
        </button>
      </div>
    </div>
    <div class="overflow-x-auto overflow-y-hidden text-white">
      <pre :class="$props.class" class="px-4"><slot /></pre>
    </div>
  </div>
  <div
    v-else
    class="flex gap-2 items-center"
  >
    <UButton
      @click="isCollapsed = !isCollapsed"
      label="Show block code"
      variant="outline"
      size="xs"
    />
    <span class="text-xs text-primary-500/80 bg-primary-500/10 px-1 py-0.5 rounded">disembunyikan karena ini untuk proses dilatar belakang.</span>
  </div>
</template>

<style>
.prose-pre {
  pre code .line {
    display: block;
  }
  .markdown-body .not-markdown-body code {
    color: initial !important;
    background-color: initial !important;
  }
}
</style>