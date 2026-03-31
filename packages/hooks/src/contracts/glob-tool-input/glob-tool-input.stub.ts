import type { GlobToolInput } from './glob-tool-input-contract';
import { globToolInputContract } from './glob-tool-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GlobToolInputStub = ({ ...props }: StubArgument<GlobToolInput> = {}): GlobToolInput =>
  globToolInputContract.parse({
    pattern: '**/*.ts',
    ...props,
  });
