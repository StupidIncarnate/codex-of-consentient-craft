declare module 'eslint-plugin-eslint-comments' {
  import type { Linter } from 'eslint';

  interface EslintCommentsPlugin {
    rules: Record<string, unknown>;
    configs?: Record<string, Linter.Config>;
  }

  const plugin: EslintCommentsPlugin;
  export default plugin;
}
