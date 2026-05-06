/**
 * PURPOSE: Reads all of process.stdin to a string until EOF
 *
 * USAGE:
 * const data = await processStdinReadAdapter();
 * // Returns the full stdin contents as a string. Returns empty string if stdin is closed immediately.
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';

export const processStdinReadAdapter = async (): Promise<FileContents> => {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }

  return fileContentsContract.parse(Buffer.concat(chunks).toString('utf8'));
};
