/**
 * PURPOSE: Defines the data `locationsPruneAssetPathsFindBroker` returns
 *
 * USAGE:
 * locationsPruneAssetPathsFindResultContract.parse(value);
 * // Returns validated LocationsPruneAssetPathsFindResult
 */
import { z } from '#gateway/npm/zod';

export const locationsPruneAssetPathsFindResultContract = z
  .object({
    runsDir: z.string().brand<'LocationsPruneAssetPathsFindResultRunsDir'>(),
    videoDir: z.string().brand<'LocationsPruneAssetPathsFindResultVideoDir'>(),
    logs: z.array(z.string().brand<'LocationsPruneAssetPathsFindResultLogs'>()).readonly(),
    transcripts: z
      .array(z.string().brand<'LocationsPruneAssetPathsFindResultTranscripts'>())
      .readonly(),
  })
  .brand<'LocationsPruneAssetPathsFindResult'>();

export type LocationsPruneAssetPathsFindResult = z.infer<
  typeof locationsPruneAssetPathsFindResultContract
>;
