export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'zinc',
    },
    card: {
      slots: {
        root: 'border-b border-neutral-500/20',
        header: 'bg-neutral-50/10 dark:bg-neutral-800/30 py-4 px-4 sm:px-4 border-b border-neutral-500/20',
        footer: 'py-4 px-4 sm:px-4 border-none',
        body: 'border-none',
        // footer: 'bg-neutral-50/30 dark:bg-neutral-800/50 py-2 px-4 sm:px-4 border-t border-neutral-500/20',
      }
    }
  }
})