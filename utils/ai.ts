import { z } from 'zod'
import merge from 'lodash.merge'
import type { AIMessageChunk } from '@langchain/core/messages';
import type { IterableReadableStream } from '@langchain/core/utils/stream';

// prompt
import PROMPT_OUTLINE from '@/libs/prompts/OUTLINE'
import PROMPT_WHATNEXT from '@/libs/prompts/WHATNEXT'
import PROMPT_LEARNTOPIC from '@/libs/prompts/LEARNTOPIC'
import * as PROMPT_QUIZ_BASELINE from '@/libs/prompts/QUIZ_BASELINE'

export const buildPrompt = <T extends z.ZodType<any, any, any>>(
  schema: T,
  defaultVals: Partial<z.infer<typeof schema>>,
  ...prompts: string[]
) => {
  return (
    obj: z.infer<typeof schema>,
  ) => {
    let oldObj = { ...obj }
    obj = merge(defaultVals, oldObj)

    let promptText = prompts.join('\n')
    // replace patern {{key}} with obj[key]
    const keys = Object.keys(obj)
    keys.forEach((key) => {
      let val = obj[key]
      if (typeof val === 'object' || Array.isArray(val)) {
        val = JSON.stringify(val)
      }
      promptText = promptText.replace(`{{${key}}}`, val)
    })
    return promptText
  }
}

export const usePrompt = () => {
  // LISTS
  return {
    // @prompt: WHAT_NEXT
    WHAT_NEXT: buildPrompt(
      // contexts
      z.object({
        topicName: z.string(),
        context: z.object({}),
        activities: z.array(z.object({})),
        outlines: z.array(z.object({})),
        schema: z.array(z.object({
          action: z.string(),
          description: z.string(),
          params: z.record(
            z.string(),
            z.object({
              schema: z.string(),
              description: z.string(),
              example: z.any(),
            })
          ),
        })),
      }),

      // default values
      {
        schema: [
          {
            action: 'quiz_baseline',
            description: `kuis ini memberikan soal - soal gambaran umum dari topik pembelajara, cocok untuk user yang baru memulai untuk melihat kemampuan atau pengetahuan user sebelumnya`,
            params: {
              reason: {
                schema: 'string',
                description: `reason why this quiz is generated, based on user history`,
                example: 'user baru saja set topik pembelajara dan melakukan generate outline untuk topik tersebut'
              },
            }
          },
          {
            action: 'quiz_endless',
            description: `kuis ini memberikan soal - soal random sesuai dengan topik pembelajaran tanpa akhir, cocok untuk user yang ingin mengasah kemampuan tanpa batasan jumlah soal`,
            params: {
              reason: {
                schema: 'string',
                description: `reason why this quiz is generated, based on user history`,
                example: 'user sudah diarasa cukup paham dengan hasil - hasil aktivitas quiz sebelumnya atau statistik kemampuan dan ingin mengasah kembali atau latihan tanpa batasan jumlah soal'
              },
            }
          },
          {
            action: 'outline_generate',
            description: `aksi untuk generate outline untuk topik pembelajaran, cocok untuk user yang belum memiliki outline untuk topik pembelajaran`,
            params: {
              reason: {
                schema: 'string',
                description: `reason why this quiz is generated, based on user history`,
                example: `user belum memiliki outline untuk topik pembelajaran yang sudah ditetapkan, maka user perlu generate outline terlebih dahulu`
              }
            }
          }
        ]
      },

      // prompt
      PROMPT_WHATNEXT,
    ),

    // @prompt: OUTLINE
    LEARNTOPIC_SUMMARIZE: buildPrompt(
      // contexts
      z.object({
        context: z.object({}),
        content: z.string(),
      }),
      // default values
      {},
      // prompt
      PROMPT_LEARNTOPIC,
    ),

    // @prompt: OUTLINE
    OUTLINE: buildPrompt(
      // contexts
      z.object({
        context: z.object({}),
        learnTopic: z.string(),
      }),
      // default values
      {},
      // prompt
      PROMPT_OUTLINE,
    ),

    // @prompt: QUIZ_BASELINE
    QUIZ_BASELINE_GENERATE_QUESTIONS: buildPrompt(
      // contexts
      z.object({
        context: z.object({}),
        outlines: z.string(),
      }),
      // default values
      {},
      // prompt
      PROMPT_QUIZ_BASELINE.GENERATE_QUESTIONS,
    ),
  }
}

export const AiStreamPuller = (actionKey: string, stream: IterableReadableStream<AIMessageChunk>) => {
  const responses: AIMessageChunk[] = []

  return {
    chunk: async (...msgs: AIMessageChunk[]) => {
      responses.push(...msgs)
    },
    countStats: (obj: SaveData['topics'][0]) => {
      const usage = {
        action: actionKey,
        input_tokens: responses.reduce((acc, curr) => acc + (curr.usage_metadata?.input_tokens || 0), 0),
        output_tokens: responses.reduce((acc, curr) => acc + (curr.usage_metadata?.output_tokens || 0), 0),
        timestamp: Date.now(),
      }
      obj.statistics.ai.usages.push(usage)
      return usage
    },

    responses,
  }
}

export const topicAiResponseOnStreamFinish = (actionKey: string, topic: SaveData['topics'][0]) => {
  return (stream: IterableReadableStream<AIMessageChunk>, responses: AIMessageChunk[]) => {
    const $saveData = useSaveData()
    const puller = AiStreamPuller(actionKey, stream)
    puller.chunk(...responses)
    puller.countStats(topic)
    $saveData.save()
  }
}

export const getJsonFromAiResponse = (responseText: string) => {
  // Regex untuk menangkap blok JSON
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const matchedJson = responseText.match(jsonRegex);
  console.log("Matched JSON:", (matchedJson as any)[0], (matchedJson as any)[1]);

  let actions = null;

  if (matchedJson && matchedJson[1]) {
    // Membersihkan blok JSON dari karakter yang tidak valid
    let cleanedJson = matchedJson[1]
      .trim()

    try {
      // Menambahkan bracket untuk memastikan validitas string JSON
      const validJson = `{ "data": ${cleanedJson} }`;
      actions = JSON.parse(validJson).data; // Parsing JSON
    } catch (error) {
      console.error("Gagal parse JSON:", error, cleanedJson);
    }
  } else {
    console.log("Tidak ada JSON yang cocok.");
  }

  return actions;
};
