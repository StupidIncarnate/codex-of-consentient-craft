/**
 * PURPOSE: Loads and parses a single quest JSON file
 *
 * USAGE:
 * await questLoadBroker({questFilePath: FilePathStub({value: '/quests/quest-1.json'})});
 * // Returns parsed Quest object
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { safeJsonParseTransformer } from '../../../transformers/safe-json-parse/safe-json-parse-transformer';
import { questContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, Quest } from '@dungeonmaster/shared/contracts';

export const questLoadBroker = async ({
  questFilePath,
}: {
  questFilePath: FilePath;
}): Promise<Quest> => {
  const fileContents = await fsReadFileAdapter({ filePath: questFilePath });

  // The reason a load fails — malformed JSON, or the specific contract field that rejected —
  // is appended to the message itself, not just tucked into `cause`, so every log site that
  // prints `String(error)` (the quest-driven watcher reconcile loop among them) names WHICH
  // field is wrong instead of an opaque "Failed to parse quest file at <path>".
  const parsed = safeJsonParseTransformer({ value: fileContents });
  if (!parsed.ok) {
    throw new Error(
      `Failed to parse quest file at ${questFilePath}: file contents are not valid JSON`,
    );
  }

  const result = questContract.safeParse(parsed.value);
  if (result.success) {
    return result.data;
  }

  const reason = result.error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Failed to parse quest file at ${questFilePath}: ${reason}`, {
    cause: result.error,
  });
};
