/**
 * PURPOSE: Creates test data for one file's capped grep hits
 *
 * USAGE:
 * const capped = CappedGrepHitsStub({ lines: [':14  if (a) {'] });
 * // Returns capped grep hits for tree-rendering tests
 */
import { cappedGrepHitsContract } from './capped-grep-hits-contract';
import type { CappedGrepHits } from './capped-grep-hits-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CappedGrepHitsStub = ({
  ...props
}: StubArgument<CappedGrepHits> = {}): CappedGrepHits =>
  cappedGrepHitsContract.parse({ labelSuffix: '', lines: [], ...props });
