import type { StubArgument } from '@dungeonmaster/shared/@types';
import { linterConfigContract } from './linter-config-contract';
import type { LinterConfig } from './linter-config-contract';

export const LinterConfigStub = ({ ...props }: StubArgument<LinterConfig> = {}): LinterConfig =>
  linterConfigContract.parse({
    rules: { 'no-console': 'error' },
    ...props,
  });
