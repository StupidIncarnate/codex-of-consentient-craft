import type { DungeonmasterHooksConfig } from './dungeonmaster-hooks-config-contract';
import { dungeonmasterHooksConfigContract } from './dungeonmaster-hooks-config-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { PreEditLintConfigStub } from '../pre-edit-lint-config/pre-edit-lint-config.stub';

export const DungeonmasterHooksConfigStub = ({
  ...props
}: StubArgument<DungeonmasterHooksConfig> = {}): DungeonmasterHooksConfig =>
  dungeonmasterHooksConfigContract.parse({
    preEditLint: PreEditLintConfigStub(),
    ...props,
  });
