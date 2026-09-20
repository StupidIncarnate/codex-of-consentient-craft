/**
 * PURPOSE: Builds a valid `FileStem` for a test that needs one but does not care which value.
 *
 * USAGE:
 * FileStemStub({ value: 'seed-session-1' });
 * // Returns branded FileStem
 */
import { fileStemContract } from './file-stem-contract';
import type { FileStem } from './file-stem-contract';

export const FileStemStub = (
  { value }: { value: string } = { value: 'seed-session-1' },
): FileStem => fileStemContract.parse(value);
