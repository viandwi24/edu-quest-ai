<script lang="ts" setup>
import { z } from 'zod'
import type { BaseModel } from '~/libs/ai';
import { v7 as uuidv7 } from 'uuid'
import dayjs from 'dayjs';


// SCHEMA
const QuestionMultipleChoiceOneAnswerSchema = z.object({
  mode: z.literal('multiple-choice-one-answer'),
  question: z.string(),
  options: z.array(z.string()),
  outlines: z.array(z.string()),
  level: z.enum(['easy', 'medium', 'hard']),
})
const QuestionMultipleChoiceMultipleAnswersSchema = z.object({
  mode: z.literal('multiple-choice-multiple-answers'),
  question: z.string(),
  options: z.array(z.string()),
  rightAnswerCount: z.number(),
  outlines: z.array(z.string()),
  level: z.enum(['easy', 'medium', 'hard']),
})
const QuestionSchema = z.union([QuestionMultipleChoiceOneAnswerSchema, QuestionMultipleChoiceMultipleAnswersSchema])
const QuestionsSchema = z.array(QuestionSchema)

const props = defineProps<{
  topic: SaveDataTopic
  quiz: SaveDataQuiz
  model: BaseModel
}>()
const { topic, quiz } = toRefs(props)



const $route = useRoute()
const $saveData = useSaveData()
const $ai = useAI()


const aiComponent = useTemplateRef('ai-component')
const aiComponentTitle = ref('Generating Questions')


// GENERATING QUESTIONS
const questions = ref<((z.infer<typeof QuestionSchema>) & { id: string })[]>([])
const isQuestionGenerating = ref(false)
const generateQuestions = (outlines: string[]) => {
  return new Promise<z.infer<typeof QuestionsSchema>>((resolve, reject) => {
    if (!aiComponent.value || !props.model) return reject('aiComponent or model is not available')
    aiComponent.value.send(props.model, async (model, responseText) => {
      if (!props.topic) return reject('topic is not available')

      // reset responseText
      responseText.value = ''
      
      // prompt
      const prompt = usePrompt().QUIZ_BASELINE_GENERATE_QUESTIONS({
        context: {},
        outlines: JSON.stringify(outlines),
      })


      try {
        // start stream chat
        await aiComponent.value?.stream(model.getLcModel(), prompt)
        console.log('responseText.value', responseText.value)

        const obj = getJsonFromAiResponse(responseText.value)
        if (!obj) return console.error('Invalid responseText', responseText.value)

        // validate questions
        const _questions = QuestionsSchema.parse(obj)

        // save questions
        console.log(_questions)
        resolve(obj)
      } catch (error) {
        console.error(error)
        reject(error)
      }
    })
  })
}
const setupQuestions = async () => {
  isQuestionGenerating.value = true

  nextTick(async () => {
    // outlines berikut berbentuk nested obj
    // { content: '', children: [{ content: '', children: [] }] }
    const outlines = topic.value.outlines || []

    // sekarang saya ingin mengambil content paling child dari setiap parent, dan menjadikannya satu array
    const recursiveGetLastContentInChild = (outlines: SaveDataTopicOutline[], prefix: string): string[] => {
      return outlines.reduce((acc, outline) => {
        if (outline.children && outline?.children?.length > 0) {
          return acc.concat(recursiveGetLastContentInChild(outline.children, prefix + outline.content + ' > '))
        }
        return acc.concat(prefix + outline.content)
      }, [] as string[])
    }
    const contents = recursiveGetLastContentInChild(outlines, '')
    
    
    // bagi per 5 outline
    const chunkedContents = contents.reduce((acc, content, index) => {
      const i = Math.floor(index / 5)
      if (!acc[i]) acc[i] = []
      acc[i].push(content)
      return acc
    }, [] as string[][])

    // generate questions
    try {
      let i = 0
      const _questions = []
      for (const chunkedContent of chunkedContents) {
        aiComponentTitle.value = `Generating Questions (${i + 1}/${chunkedContents.length})`
        const res = await generateQuestions(chunkedContent)
        _questions.push(...res)
        i++
      }

      // parsing
      questions.value = _questions.map((question) => {
        return {
          ...question,
          id: uuidv7(),
        }
      })

      // parse to save data
      for (const question of questions.value) {
        const params: any = {}

        // if
        const allParamsWithoutModeAndQuestion: any = {...question}
        delete allParamsWithoutModeAndQuestion['mode']
        delete allParamsWithoutModeAndQuestion['question']
        delete allParamsWithoutModeAndQuestion['outlines']
        delete allParamsWithoutModeAndQuestion['level']
        params[question.mode as any] = {
          ...allParamsWithoutModeAndQuestion,
        }

        // 
        quiz.value.questions.push({
          id: question.id,
          mode: question.mode,
          question: question.question,
          params,
          outlines: question.outlines,
          level: question.level,
        })
        $saveData.save()
      }
    } catch (error) {
      console.error(error)
    }

    isQuestionGenerating.value = false

    // 
    $currQuestion.pickNextQuestion()
  })
}
onMounted(() => {
  // load questions
  const _questions: ((z.infer<typeof QuestionSchema>) & { id: string })[] = []
  for (const question of quiz.value.questions) {
    _questions.push({
      id: question.id,
      mode: question.mode,
      question: question.question,
      ...question.params[question.mode],
    })
  }
  questions.value = _questions

  nextTick(async () => {
    // setup
    if (questions.value.length === 0) await setupQuestions()

    // check finish
    $currQuestion.updateAnswered()

    // check finish
    nextTick(() => {
      $currQuestion.pickNextQuestion()
    })
  })
  
})

// PAGINATION QUESTIONS
const $currQuestion = (() => {
  const id = ref<string>()
  const questionsAnswered = ref<string[]>([])

  const updateAnswered = () => {
    questionsAnswered.value = questions.value
      .filter(q => {
        const question = quiz.value.questions.find(qq => qq.id === q.id)
        return question && question.answerAt && question.answer
      })
      .map(q => q.id)
  }
  watch(questions, () => {
    updateAnswered()
  })

  const current = computed(() => questions.value.find((question) => question.id === id.value))

  const pickNextQuestion = () => {
    const questionWithoutAnswer = quiz.value.questions.find(q => !q.answer && !q.answerAt)
    if (questionWithoutAnswer) {
      id.value = questionWithoutAnswer.id
      questionWithoutAnswer.viewAt = Date.now()
    } else {
      checkFinish()
    }
  }

  const anwser = (answer: string) => {
    if (!current.value) return

    // set right 
    const setReport = (isCorrect: boolean) => {
      // set report
      const question = quiz.value.questions.find(q => q.id === current.value?.id)
      if (question) {
        question.answer = answer
        question.answerAt = Date.now()
        question.correct = isCorrect
        $saveData.save()

        // update answered
        updateAnswered()

        // pick next question
        pickNextQuestion()
      } else {
        checkFinish()
      }
    }

    // by mode
    if (current.value.mode == 'multiple-choice-one-answer') {
      // check answer with first option is the right answer
      setReport(answer === current.value.options[0])
    } else if (current.value.mode == 'multiple-choice-multiple-answers') {
      // check answer with rightAnswerCount
      const rightAnswerCount = current.value.rightAnswerCount
      const rightAnswers = current.value.options.slice(0, rightAnswerCount)
      const isCorrect = rightAnswers.includes(answer)
      setReport(isCorrect)
    }
  }

  const checkFinish = () => {
    // check finish
    const questionWithoutAnswer = quiz.value.questions.find(q => !q.answer && !q.answerAt)
    if (questionWithoutAnswer) return
    id.value = undefined

    // finish
    if (!quiz.value.finishTimestamp) {
      quiz.value.finishTimestamp = Date.now()
    }
    
    // check in activites
    const activity = topic.value.activities.find(a => a.action === 'quiz_baseline' && a.data['quizId'] === quiz.value.id)
    if (!activity) {
      topic.value.activities.push({
        action: 'quiz_baseline',
        data: {
          quizId: quiz.value.id,
          total: quiz.value.questions.length,
          correct: quiz.value.questions.filter(q => q.correct).length,
          level: {
            hard: {
              correct: quiz.value.questions.filter(q => q.correct && q.level === 'hard').length,
              total: quiz.value.questions.filter(q => q.level === 'hard').length,
            },
            medium: {
              correct: quiz.value.questions.filter(q => q.correct && q.level === 'medium').length,
              total: quiz.value.questions.filter(q => q.level === 'medium').length,
            },
            easy: {
              correct: quiz.value.questions.filter(q => q.correct && q.level === 'easy').length,
              total: quiz.value.questions.filter(q => q.level === 'easy').length,
            },
          },
          startAt: dayjs(quiz.value.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          finishAt: dayjs(quiz.value.finishTimestamp).format('YYYY-MM-DD HH:mm:ss'),
          outlines: quiz.value.questions.map(q => q.outlines).flat(),
        },
        description: 'Quiz Baseline',
        timestamp: quiz.value.finishTimestamp,
      })
      $saveData.save()
    }
  }

  return {
    anwser,
    current,
    questionsAnswered,
    updateAnswered,
    pickNextQuestion,
  }
})()
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
          <UIcon name="ph:note-pencil-duotone" />
          <h1 class="font-semibold capitalize">
            Quiz Baseline
          </h1>
        </div>
        <div class="flex items-center gap-2">
        </div>
      </div>
    </template>

    <!-- paginate -->
    <div v-if="questions.length > 0 && $currQuestion.questionsAnswered.value.length != questions.length" class="flex-1 flex flex-col gap-4">
      <div class="flex">
        <div class="bg-primary-500/20 px-3 py-1 rounded-full text-xs">
          No {{ $currQuestion.questionsAnswered.value.length + 1 }} / {{ questions.length }}
        </div>
      </div>
      <div v-if="$currQuestion.current.value">
        <div class="pl-1">
          <LazyMDC :value="$currQuestion.current.value.question" />
        </div>
        <div class="pl-1 mt-6 flex flex-col gap-1">
          <div class="text-sm font-semibold text-gray-500 mb-2">Options: </div>
          <div
            v-for="(option, i) in $currQuestion.current.value.options"
            :key="i"
            class="flex gap-2 text-gray-500 hover:text-gray-100 cursor-pointer"
            @click="() => $currQuestion.anwser(option)"
          >
            <div class="pt-0.5">
              <UIcon name="ph:circle-duotone" />
            </div>
            <div>
              <!-- <LazyMDC :value="option" /> -->
              {{ option }}
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-center">
        <!-- <UButton @click="() => $currQuestion.prev()" label="Prev" icon="ph:arrow-left" /> -->
        <!-- <UButton @click="() => $currQuestion.next()" label="Next" trailingIcon="ph:arrow-right" /> -->
      </div>
    </div>

    <!-- list of questions -->
    <div v-else-if="questions.length > 0 && $currQuestion.questionsAnswered.value.length == questions.length">
      <div class="flex-1 flex flex-col gap-2 items-center justify-center bg-primary-500/5 p-4 rounded-lg">
        <div class="flex items-center justify-center">
          <UIcon name="ph:check-circle-duotone" class="text-primary-500 text-6xl" />
        </div>
        <div class="text-center">
          <h1 class="font-semibold text-2xl">All questions has been answered</h1>
          <p class="text-gray-500">You can review your answers</p>
        </div>
      </div>
    </div>
    
    <AIResponse v-if="isQuestionGenerating" ref="ai-component" :title="aiComponentTitle" @stream-finish="(...e) => topic && topicAiResponseOnStreamFinish('quiz_baseline', topic)(...e)" />
  </UCard>
</template>