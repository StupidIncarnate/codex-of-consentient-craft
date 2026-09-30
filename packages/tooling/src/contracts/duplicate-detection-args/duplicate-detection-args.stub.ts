import { duplicateDetectionArgsContract } from './duplicate-detection-args-contract';
import type { DuplicateDetectionArgs } from './duplicate-detection-args-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const DuplicateDetectionArgsStub = ({
  ...props
}: StubArgument<DuplicateDetectionArgs> = {}): DuplicateDetectionArgs =>
  duplicateDetectionArgsContract.parse({
    threshold: 3,
    ...props,
  });
