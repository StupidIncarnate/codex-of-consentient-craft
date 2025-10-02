import { ESLint } from 'eslint';

export type { ESLint };

export const eslintEslint = ({ options }: { options: ESLint.Options }): ESLint =>
  new ESLint(options);
