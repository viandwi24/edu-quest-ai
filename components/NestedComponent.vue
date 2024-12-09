<script lang="ts" setup>
const props = defineProps<{
  as?: string
  content?: any
  children?: any[]
  depth: number
  indexs: number[]
  childClass?: string
}>()

const displayAs = computed(() => {
  if (props.as) return props.as
  return 'div'
})
</script>

<template>
  <component :is="displayAs">
    <slot :content="content" :children="children" :depth="depth" :indexs="indexs" />
    <!-- <slot :name="`depth-${depth}`" :content="content" :children="children" :depth="depth">
      <slot :content="content" :children="children" :depth="depth" />
    </slot> -->

    <div :class="childClass">
      <NestedComponent
        v-for="(item, i) in children || []"
        :key="`${depth}-${i}`"
        :as="displayAs"
        :content="item.content"
        :children="item.children || []"
        :depth="depth + 1"
        :childClass="childClass"
        :indexs="[...indexs, i]"
      >
        <!-- <slot :name="`depth-${depth + 1}`" :content="item.content" :children="item.children" :depth="depth + 1">
          <slot :content="item.content" :children="item.children" :depth="depth + 1" />
        </slot> -->
        <template
          v-for="(_, name) in $slots"
          v-slot:[name]="data: any"
        >
          <slot :name="name" v-bind="(data as any)" />
        </template>
      </NestedComponent>
    </div>
  </component>
</template>
