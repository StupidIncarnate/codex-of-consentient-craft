import type { StubArgument } from '@dungeonmaster/shared/@types';
import { errorEntryContract, type ErrorEntry } from './error-entry-contract';

export const ErrorEntryStub = ({ ...props }: StubArgument<ErrorEntry> = {}): ErrorEntry =>
  errorEntryContract.parse({
    filePath: 'src/index.ts',
    line: 10,
    column: 5,
    message: 'Unexpected any',
    severity: 'error',
    ...props,
  });
