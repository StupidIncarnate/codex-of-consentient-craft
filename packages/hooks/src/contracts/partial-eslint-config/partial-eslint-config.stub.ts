import type { StubArgument } from '@dungeonmaster/shared/@types';
import { partialEslintConfigContract } from './partial-eslint-config-contract';
import type { PartialEslintConfig } from './partial-eslint-config-contract';

export const PartialEslintConfigStub = ({
  ...props
}: StubArgument<PartialEslintConfig> = {}): PartialEslintConfig =>
  partialEslintConfigContract.parse({
    rules: {},
    ...props,
  });
