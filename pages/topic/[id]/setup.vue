<script lang="ts" setup>
const isMounted = ref(false)
onMounted(() => {
  nextTick(() => {
    isMounted.value = true
  })
})
</script>

<template>
  <PageSetup v-if="isMounted" initiated />
</template>