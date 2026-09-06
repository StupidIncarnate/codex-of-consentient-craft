/**
 * PURPOSE: Answers where a path REALLY lands, with every symlink in every one of its segments
 * resolved. Reach for this over fsStatAdapter when a caller is about to decide whether a path is
 * allowed to be read: a symlink answers a stat about itself while the bytes come from wherever it
 * points, so a check made against the unresolved name is a check an attacker can step around.
 *
 * USAGE:
 * const realPath = await fsRealpathAdapter({ filePath: AbsoluteFilePathStub({ value: '/tmp/q/images/a.png' }) });
 * // Returns the canonical absolute path, or rejects when nothing exists at filePath
 */

import { realpath } from 'fs/promises';

import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<AbsoluteFilePath> => absoluteFilePathContract.parse(await realpath(filePath));
