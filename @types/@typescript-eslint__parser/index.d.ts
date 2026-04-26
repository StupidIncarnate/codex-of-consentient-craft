declare module '@typescript-eslint/parser' {
  import type { Linter } from 'eslint';

  export const parse: Linter.Parser['parse'];
  export const parseForESLint: Linter.Parser['parseForESLint'];
  export const version: string;
  export const meta: { name: string; version: string };
}
