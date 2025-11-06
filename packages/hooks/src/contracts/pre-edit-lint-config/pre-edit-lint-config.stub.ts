import type { PreEditLintConfig } from './pre-edit-lint-config-contract';
import { preEditLintConfigContract } from './pre-edit-lint-config-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const PreEditLintConfigStub = ({
  ...props
}: StubArgument<PreEditLintConfig> = {}): PreEditLintConfig =>
  preEditLintConfigContract.parse({
    rules: ['@questmaestro/enforce-project-structure'],
    ...props,
  });
