/**
 * PURPOSE: Writes content to a file at the specified path
 *
 * USAGE:
 * fsWriteFileAdapter({filePath: '/tmp/test.txt', content: FileContentStub({value: 'hello world'})});
 * // Writes the content to the file
 */

import { writeFileSync } from 'fs';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

export const fsWriteFileAdapter = ({
  filePath,
  content,
}: {
  filePath: string;
  content: FileContent;
}): void => {
  writeFileSync(filePath, content);
};
