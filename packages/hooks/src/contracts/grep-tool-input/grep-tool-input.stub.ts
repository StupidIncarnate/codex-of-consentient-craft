import type { GrepToolInput } from './grep-tool-input-contract';
import { grepToolInputContract } from './grep-tool-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GrepToolInputStub = ({ ...props }: StubArgument<GrepToolInput> = {}): GrepToolInput =>
  grepToolInputContract.parse({
    pattern: 'searchTerm',
    ...props,
  });
