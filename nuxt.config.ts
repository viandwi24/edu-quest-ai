import { resolve } from "path";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/mdc', 'nuxt-jsoneditor'],
  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: [
        'lodash.merge',
        'dayjs',

        // 
        'shiki',
        'shiki/engine/javascript',
        'shiki/core',
        'shiki/langs/javascript.mjs',
        'shiki/langs/jsx.mjs',
        'shiki/langs/json.mjs',
        'shiki/langs/typescript.mjs',
        'shiki/langs/tsx.mjs',
        'shiki/langs/vue.mjs',
        'shiki/langs/css.mjs',
        'shiki/langs/html.mjs',
        'shiki/langs/shellscript.mjs',
        'shiki/langs/markdown.mjs',
        'shiki/langs/mdc.mjs',
        'shiki/langs/yaml.mjs',
        'shiki/themes/vitesse-dark.mjs',
        '@shikijs/transformers',

        // 
        'vue3-ts-jsoneditor',
      ]
    }
  },

  components: [
    {
      global: true,
      path: resolve('./components')
    },
    {
      global: true,
      path: resolve('./components/content')
    }
  ],

  colorMode: {
    preference: 'dark',
  },

  mdc: {
    highlight: {
      theme: {
        default: 'vitesse-dark',
        dark: 'vitesse-dark',
      },
      shikiEngine: 'javascript',
    },
  },
  

  jsoneditor: {
    componentName: 'JsonEditor',
    options: {
      darkTheme: true,
    },
    // @ts-ignore
    includeCss: true,
  },
})