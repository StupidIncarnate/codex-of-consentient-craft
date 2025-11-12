import type { StubArgument } from '@questmaestro/shared/@types';
import { rawEslintConfigContract } from './raw-eslint-config-contract';
import type { RawEslintConfig } from './raw-eslint-config-contract';

export const RawEslintConfigStub = ({
  ...props
}: StubArgument<RawEslintConfig> = {}): RawEslintConfig =>
  rawEslintConfigContract.parse({
    rules: {},
    language: { fileType: 'text' },
    ...props,
  });
