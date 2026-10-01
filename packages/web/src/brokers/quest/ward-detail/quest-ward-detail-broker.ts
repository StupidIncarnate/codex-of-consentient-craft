/**
 * PURPOSE: Fetches the detail blob for one ward result from the per-quest ward-detail HTTP endpoint
 * and parses it into the WardDetail shape the breakdown renderer consumes.
 *
 * USAGE:
 * const detail = await questWardDetailBroker({ questId, wardResultId });
 * // Returns WardDetail (checks[] with per-file errors / per-suite test failures)
 */

import { z } from '#gateway/npm/zod';
import { wardDetailContract } from '@dungeonmaster/shared/contracts';
import type { WardDetail, WardResult, Quest } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questWardDetailBroker = async ({
  questId,
  wardResultId,
}: {
  questId: Quest['id'];
  wardResultId: WardResult['id'];
}): Promise<WardDetail> => {
  const url = webConfigStatics.api.routes.questWardDetail
    .replace(':questId', questId)
    .replace(':wardResultId', wardResultId);

  const response = await fetchJson({ url });
  const parsed = z.object({ detail: wardDetailContract }).parse(response);

  return parsed.detail;
};
