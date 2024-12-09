import type { BaseFunctionCallOptions } from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { AIMessageChunk } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { z } from "zod";

export interface BaseModelMetadata {
  id: string;
  name: string;
  group: string;
}

export interface BaseModelSettingSchema {
  key: string;
  name: string;
  description: string;
  schema: z.ZodType<any, any, any>;
  input: 'text' | 'number' | 'toggle';
  defaultValue?: any;
}

export class BaseModel {
  metadata: BaseModelMetadata = {
    id: '-',
    name: 'unknown',
    group: 'unknown'
  }

  settingSchema: BaseModelSettingSchema[] = []
  
  constructor(
    public settings: {
      [key: string]: any;
    }
  ) {
    console.log('BaseModel init', this)
  }

  getLcModel(): BaseChatModel<BaseFunctionCallOptions, AIMessageChunk> {
    throw new Error('Not implemented')
  }
}

export class OpenAIBaseModel extends BaseModel {
  override metadata = {
    group: 'openai',
    id: 'openai',
    name: 'openai'
  }
  override settingSchema: BaseModelSettingSchema[] = [
    {
      key: 'model.openai.apiKey',
      name: 'API Key',
      description: 'OpenAI API Key',
      input: 'text',
      schema: z.string(),
      defaultValue: undefined
    }
  ]
  modelName: string = ''

  override getLcModel() {
    const model = new ChatOpenAI({
      model: this.modelName,
      apiKey: this.settings['model.openai.apiKey'] || '',
      streaming: true,
    })
    return model
  }
}

export class OpenAIGPT4o extends OpenAIBaseModel {
  override metadata = {
    group: 'ai',
    id: 'openai.gpt4o',
    name: 'Gpt 4o'
  }
  override modelName = 'gpt-4o'
}

export class OpenAIGPT3dot5Turbo extends OpenAIBaseModel {
  override metadata = {
    group: 'ai',
    id: 'openai.gpt3turbo',
    name: 'Gpt 3.5 Turbo'
  }
  override modelName = 'gpt-3.5-turbo'
}

export class OpenAIGPT4 extends OpenAIBaseModel {
  override metadata = {
    group: 'ai',
    id: 'openai.gpt4',
    name: 'Gpt 4'
  }
  override modelName = 'gpt-4'
}

export class GoogleGenerativeAIBaseModel extends BaseModel {
  override metadata = {
    group: 'google',
    id: 'google',
    name: 'google'
  }
  override settingSchema: BaseModelSettingSchema[] = [
    {
      key: 'model.google.apiKey',
      name: 'API Key',
      description: 'Google Generative Ai API Key',
      input: 'text',
      schema: z.string(),
      defaultValue: undefined
    }
  ]
  modelName: string = ''

  override getLcModel() {
    const model = new ChatGoogleGenerativeAI({
      model: this.modelName,
      apiKey: this.settings['model.google.apiKey'] || '',
      streaming: true,
    })
    return model
  }
}

export class GoogleGenerativeAIGemini1dot5Pro extends GoogleGenerativeAIBaseModel {
  override metadata = {
    group: 'google',
    id: 'google.gemini-1.5-pro',
    name: 'Gemini 1.5 Pro'
  }
  override modelName = 'gemini-1.5-pro'
}

export class GoogleGenerativeAIGemini1dot5Flash extends GoogleGenerativeAIBaseModel {
  override metadata = {
    group: 'google',
    id: 'google.gemini-1.5-flash',
    name: 'Gemini 1.5 Flash'
  }
  override modelName = 'gemini-1.5-flash'
}