/**
 * PURPOSE: Adds content to the end of a file, creating it when absent. Reach for this over
 * `fsWriteFileAdapter` whenever several writers share one file — jest workers each reporting their
 * own findings, say — where a write would silently drop whatever the other workers had put there.
 *
 * USAGE:
 * fsAppendFileAdapter({filePath: '/tmp/findings.jsonl', content: FileContentStub({value: 'a\n'})});
 * // Returns {success: true} and leaves anything already in the file untouched
 */

import { appendFileSync } from 'fs';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

export const fsAppendFileAdapter = ({
  filePath,
  content,
}: {
  filePath: string;
  content: FileContent;
}): AdapterResult => {
  appendFileSync(filePath, content);

  return { success: true as const };
};
