import type { PreEditLintConfig } from './pre-edit-lint-config-contract';
import { preEditLintConfigContract } from './pre-edit-lint-config-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const PreEditLintConfigStub = ({
  ...props
}: StubArgument<PreEditLintConfig> = {}): PreEditLintConfig =>
  preEditLintConfigContract.parse({
    rules: ['@dungeonmaster/enforce-project-structure'],
    ...props,
  });
