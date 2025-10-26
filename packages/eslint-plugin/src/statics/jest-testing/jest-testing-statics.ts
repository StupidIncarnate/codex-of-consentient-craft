export const jestTestingStatics = {
  methods: ['test', 'it', 'describe'],
  forbiddenSuffixes: ['todo', 'skip'],
  cleanupFunctions: ['clearAllMocks', 'resetAllMocks', 'restoreAllMocks', 'resetModuleRegistry'],
} as const;
