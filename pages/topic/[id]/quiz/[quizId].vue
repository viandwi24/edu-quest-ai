<script lang="ts" setup>
const $route = useRoute()
const $saveData = useSaveData()
const $ai = useAI()

const topicId = computed(() => $route.params.id)
const quizId = computed(() => $route.params.quizId)
const topic = computed(() => $saveData.data.topics.find((topic) => topic.id === topicId.value))
const quiz = computed(() => topic.value?.quizzes.find((quiz) => quiz.id === quizId.value))
const model = computed(() => $ai.getModel($saveData.data.settings['model']))
</script>

<template>
  <div
    v-if="quiz && topic && model"
    class="flex-1 flex"
  >
    <QuizBaseline v-if="quiz.mode == 'baseline'" :topic="topic" :quiz="quiz" :model="model" />
    <QuizEndless v-else-if="quiz.mode == 'endless'" :topic="topic" :quiz="quiz" :model="model" />
  </div>
</template>