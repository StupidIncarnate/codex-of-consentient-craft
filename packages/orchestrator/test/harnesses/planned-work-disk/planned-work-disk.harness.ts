/**
 * PURPOSE: Real-disk assertions for planned-work integration tests — directory existence, tmp-file
 * survival, and raw JSON reads. Kept out of the scenario file: `.integration.test.ts` files must
 * not import Node's fs directly, only `.harness.ts` files may.
 *
 * USAGE:
 * const disk = plannedWorkDiskHarness();
 * disk.dirExists({ questFolderPath });
 */

import { existsSync, readFileSync } from 'fs';

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, OperationItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

const JSON_EXTENSION = '.json';
const TMP_SUFFIX = '.tmp';

const finalPathFor = ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItemId;
}): FilePath =>
  filePathContract.parse(
    `${String(questFolderPath)}/${locationsStatics.quest.plannedWorkDir}/${String(operationItemId)}${JSON_EXTENSION}`,
  );

export const plannedWorkDiskHarness = (): {
  dirExists: (params: { questFolderPath: AbsoluteFilePath }) => boolean;
  finalFileExists: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => boolean;
  tmpFileExists: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => boolean;
  readFinalFileRaw: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => unknown;
} => ({
  dirExists: ({ questFolderPath }: { questFolderPath: AbsoluteFilePath }): boolean =>
    existsSync(
      filePathContract.parse(`${String(questFolderPath)}/${locationsStatics.quest.plannedWorkDir}`),
    ),

  finalFileExists: ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }): boolean => existsSync(finalPathFor({ questFolderPath, operationItemId })),

  tmpFileExists: ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }): boolean =>
    existsSync(
      filePathContract.parse(`${finalPathFor({ questFolderPath, operationItemId })}${TMP_SUFFIX}`),
    ),

  readFinalFileRaw: ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }): unknown =>
    JSON.parse(readFileSync(finalPathFor({ questFolderPath, operationItemId }), 'utf8')) as unknown,
});
