/**
 * PURPOSE: Real-disk assertions for planned-work integration tests — directory existence, tmp-file
 * survival, and raw JSON reads. Kept out of the scenario file: `.integration.test.ts` files must
 * not import Node's fs directly, only `.harness.ts` files may.
 *
 * USAGE:
 * const disk = plannedWorkDiskHarness();
 * disk.dirExists({ questFolderPath });
 */

import { existsSync, readFileSync } from '#gateway/node/fs';

import type { OperationItem } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

const JSON_EXTENSION = '.json';
const TMP_SUFFIX = '.tmp';

const finalPathFor = ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: string;
  operationItemId: OperationItem['id'];
}): string =>
  `${questFolderPath}/${locationsStatics.quest.plannedWorkDir}/${String(operationItemId)}${JSON_EXTENSION}`;

export const plannedWorkDiskHarness = (): {
  dirExists: (params: { questFolderPath: string }) => boolean;
  finalFileExists: (params: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
  }) => boolean;
  tmpFileExists: (params: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
  }) => boolean;
  readFinalFileRaw: (params: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
  }) => unknown;
} => ({
  dirExists: ({ questFolderPath }: { questFolderPath: string }): boolean =>
    existsSync(`${questFolderPath}/${locationsStatics.quest.plannedWorkDir}`),

  finalFileExists: ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
  }): boolean => existsSync(finalPathFor({ questFolderPath, operationItemId })),

  tmpFileExists: ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
  }): boolean => existsSync(`${finalPathFor({ questFolderPath, operationItemId })}${TMP_SUFFIX}`),

  readFinalFileRaw: ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
  }): unknown =>
    JSON.parse(readFileSync(finalPathFor({ questFolderPath, operationItemId }))) as unknown,
});
