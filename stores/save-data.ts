import { z } from "zod";
import { v7 as uuidv7 } from 'uuid'

export interface SaveDataQuizQuestion {
  // mode: 'multiple-choice-one-answer' | 'multiple-choice-multiple-answers'
  outlines: string[];
  id: string;
  mode: string;
  question: string;
  answer?: string;
  correct?: boolean;

  params: {
    // 'multiple-choice-one-answer': {
    //   options: string[];
    // }
    // 'multiple-choice-multiple-answers': {
    //   options: string[];
    //   delimiter: number;
    // }
    [key: string]: any;
  }
  viewAt?: number;
  answerAt?: number;
  level: 'easy' | 'medium' | 'hard';
}

export interface SaveDataQuizReport {
  totalCorrect: number;
  totalTime: number;
}

export interface SaveDataQuiz {
  id: string;
  mode: string

  questions: SaveDataQuizQuestion[];
  report?: SaveDataQuizReport;
  params: {
    [key: string]: any;
  }

  timestamp: number;
  finishTimestamp?: number;
}

export interface SaveDataTopicOutline {
  content: string;
  children: SaveDataTopicOutline[];
}

export interface SaveDataTopicActivity {
  action: string;
  description: string;
  data: {
    [key: string]: any;
  }
  timestamp: number;
}

export interface SaveDataTopic {
  id: string;
  timestamp: number;
  name: string;

  // knowledge
  learnTopic: string;
  outlines?: SaveDataTopicOutline[];

  // 
  statistics: {
    ai: {
      usages: {
        action: string;
        input_tokens: number;
        output_tokens: number;
        timestamp: number;
      }[]
    }
  }

  // activities
  activities: SaveDataTopicActivity[];

  // features
  // history of quiz user takes
  quizzes: SaveDataQuiz[];
  
  // dashboard
  whatNexts: {
    timestamp: number;
    content: string;
    activitiesCount: number;
    suggestionActions: any[];
  }[]
}

export interface SaveData {
  version: string;
  user: {
    name: string;
  }
  settings: {
    [key: string]: any;
  }
  topics: SaveDataTopic[]
}


export const SaveDataSchema = z.object({
  version: z.string(),
  user: z.object({
    name: z.string()
  }),
  settings: z.record(z.any()),
  topics: z.array(z.object({
    id: z.string(),
    timestamp: z.number(),
    name: z.string(),

    learnTopic: z.string(),
    outlines: z.any(),

    statistics: z.object({
      ai: z.object({
        usages: z.array(z.object({
          action: z.string(),
          input_tokens: z.number(),
          output_tokens: z.number(),
          timestamp: z.number()
        }))
      })
    }),

    activities: z.array(z.object({
      timestamp: z.number(),
      action: z.string(),
      description: z.string(),
      data: z.record(z.string(), z.any())
    })),

    whatNexts: z.array(z.object({
      timestamp: z.number(),
      content: z.string(),
      activitiesCount: z.number(),
      suggestionActions: z.array(z.any()),
    })),

    quizzes: z.array(z.object({
      id: z.string(),
      mode: z.string(),

      questions: z.array(z.object({
        id: z.string(),
        mode: z.string(),
        question: z.string(),
        answer: z.string().optional(),
        params: z.record(z.string(), z.any()),
        viewAt: z.number().optional(),
        answerAt: z.number().optional(),
        correct: z.boolean().optional(),
        outlines: z.array(z.string()),
        level: z.enum(['easy', 'medium', 'hard']),
      })),
      report: z.object({
        totalCorrect: z.number(),
        totalTime: z.number()
      }).optional(),
      params: z.record(z.string(), z.any()),

      timestamp: z.number(),
      finishTimestamp: z.number().optional()
    }))
  })),
});

export interface ISaveDataState {
  status: 'unloaded' | 'loaded' | 'saving' | 'error' | 'loading';
  loaded: boolean;
  data: SaveData;

  page: 'home' | 'setup' | 'project' | 'dashboard';
}

const DEFAULT_SETTING: SaveData = {
  version: "1.0.0",
  user: {
    name: "Guest"
  },
  settings: {},
  topics: [],
}

export const useSaveData = defineStore("save-data", {
  state: (): ISaveDataState => ({
    status: 'unloaded',
    loaded: false,
    data: {...DEFAULT_SETTING},

    page: 'home'
  }),
  actions: {
    load() {
      try {
        const $ai = useAI();
        this.status = 'loading';
        const data = localStorage.getItem("save-data");
        if (data) {
          const parsed = SaveDataSchema.parse(JSON.parse(data));
          this.data = parsed;
          this.loaded = true;
          this.changePage('project');
          $ai.reload();
          return true;
        }
      } catch (error) {
        console.error(`Error loading save data: ${error}`);
        console.warn('Resetting save data');
      }

      this.status = 'loaded';
      this.data = {...DEFAULT_SETTING};
      return false;
    },
    save() {
      this.status = 'saving';
      localStorage.setItem("save-data", JSON.stringify(this.data));
      this.status = 'loaded';
    },
    reset() {
      this.data = {...DEFAULT_SETTING};
      localStorage.removeItem("save-data");
      this.changePage('home');
    },


    setSettings(settings: SaveData['settings']) {
      const $ai = useAI();
      this.data.settings = settings;
      $ai.reload();
    },


    // pages
    changePage(page: ISaveDataState['page']) {
      this.page = page;
    },


    // topics
    createTopic(name: string) {
      this.data.topics.push({
        id: uuidv7(),
        timestamp: Date.now(),
        name,

        activities: [],

        quizzes: [],

        statistics: {
          ai: {
            usages: []
          }
        },

        // 
        learnTopic: '',
        outlines: [],

        whatNexts: []
      });
      this.save();
    }
  }
})