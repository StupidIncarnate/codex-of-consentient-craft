/**
 * PURPOSE: Create directory on filesystem using fs/promises
 *
 * USAGE:
 * await fsMkdirAdapter({ filepath: PathSegmentStub({ value: '/path/to/dir' }) });
 * // Creates directory on filesystem with recursive option
 *
 * CONTRACTS: Input: PathSegment (branded string)
 * CONTRACTS: Output: AdapterResult
 */

import { mkdir } from 'fs/promises';
import type { AdapterResult, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapter = async ({
  filepath,
}: {
  filepath: PathSegment;
}): Promise<AdapterResult> => {
  await mkdir(filepath, { recursive: true });

  return { success: true as const };
};
