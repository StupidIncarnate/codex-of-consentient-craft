import type { QuestmaestroHooksConfig } from './questmaestro-hooks-config-contract';
import { questmaestroHooksConfigContract } from './questmaestro-hooks-config-contract';
import type { StubArgument } from '@questmaestro/shared/@types';
import { PreEditLintConfigStub } from '../pre-edit-lint-config/pre-edit-lint-config.stub';

export const QuestmaestroHooksConfigStub = ({
  ...props
}: StubArgument<QuestmaestroHooksConfig> = {}): QuestmaestroHooksConfig =>
  questmaestroHooksConfigContract.parse({
    preEditLint: PreEditLintConfigStub(),
    ...props,
  });
