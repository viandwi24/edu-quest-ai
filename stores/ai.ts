import { z } from "zod";
import { BaseModel, GoogleGenerativeAIGemini1dot5Flash, GoogleGenerativeAIGemini1dot5Pro, OpenAIGPT3dot5Turbo, OpenAIGPT4, OpenAIGPT4o } from "~/libs/ai";

export const useAI = defineStore("ai", {
  state: () => ({
    loaded: false,
    registeredModels: [] as BaseModel[],
  }),
  actions: {
    getRegisterModels() {
      return [
        OpenAIGPT4o,
        OpenAIGPT4,
        OpenAIGPT3dot5Turbo,
        GoogleGenerativeAIGemini1dot5Flash,
        GoogleGenerativeAIGemini1dot5Pro,
      ]
    },
    load() {
      if (this.loaded) return;

      const $saveData = useSaveData();

      for (const model of this.getRegisterModels()) {
        this.registeredModels.push(new model($saveData.data.settings));
      }

      this.loaded = true;
    },
    reload() {
      this.loaded = false;
      this.registeredModels = [];
      this.load();
    },
    getModels() {
      return this.registeredModels;
    },
    getModel(id: string) {
      return this.registeredModels.find((model) => model.metadata.id === id);
    }
  }
})