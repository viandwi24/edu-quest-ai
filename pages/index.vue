<script lang="ts" setup>
const $saveData = useSaveData()
const { loaded, page } = storeToRefs($saveData)

useSeoMeta({
  title: 'EduQuestAI',
  description: 'Platform membantu kamu belajar dengan bantuan AI, berbasis web tanpa server dan open source.',
})
</script>

<template>
  <Container v-if="page == 'home'" class="flex-1 flex flex-col justify-center">
    <div class="w-full text-center">
      <h1 class="text-4xl font-bold mt-8">EduQuestAI</h1>
      <div class="mt-2 w-[500px] mx-auto text-lg text-gray-500">
        <p class="">
          Platform yang membantu kamu fokus belajar dengan bantuan AI, berbasis web tanpa server dan open source.
        </p>
      </div>
      <div class="mt-4 flex justify-center items-center gap-4">
        <UButton
          icon="ph:book-open-duotone"
          trailing-icon="ph:arrow-right-duotone"
          label="Start Learn Now"
          variant="solid"
          @click="page = 'setup'"
        />
      </div>
    </div>
  </Container>
  <Container v-else-if="page == 'setup'" class="flex-1 flex flex-col justify-center py-4 overflow-hidden max-h-[calc(100vh-58px-36px)]">
    <PageSetup />
  </Container>
  <PageProject v-else-if="page == 'project'" />
</template>