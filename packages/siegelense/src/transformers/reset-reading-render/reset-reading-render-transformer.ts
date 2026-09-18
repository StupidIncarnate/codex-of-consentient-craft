/**
 * PURPOSE: Turns a ResetReading into ContentText JSON so a session reading step results
 * sees the restored snapshot, undid diff, and NOT_cleared boundaries.
 *
 * USAGE:
 * resetReadingRenderTransformer({ reading: ResetReadingStub() });
 * // Returns '{"restored":"clean","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { ResetReading } from '../../contracts/reset-reading/reset-reading-contract';

export const resetReadingRenderTransformer = ({
  reading,
}: {
  reading: ResetReading;
}): ContentText => contentTextContract.parse(JSON.stringify(reading));
