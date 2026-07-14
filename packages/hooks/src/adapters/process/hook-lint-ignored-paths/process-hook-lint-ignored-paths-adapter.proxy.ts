export const processHookLintIgnoredPathsAdapterProxy = (): {
  enable: () => void;
  disable: () => void;
} => ({
  enable: (): void => {
    process.env.DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS = 'true';
  },
  disable: (): void => {
    Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS');
  },
});
