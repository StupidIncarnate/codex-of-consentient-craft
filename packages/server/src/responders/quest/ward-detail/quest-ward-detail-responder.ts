/**
 * PURPOSE: Handles GET requests for a single ward result's detail blob — validates the questId +
 * wardResultId params, resolves the quest folder, reads <questFolder>/ward-results/<wardResultId>.json,
 * and returns the parsed detail. Returns 404 when the detail file is absent (ward passed, crashed
 * before producing a runId, or detail not yet written).
 *
 * USAGE:
 * const result = await QuestWardDetailResponder({ params: { questId, wardResultId } });
 * // Returns { status: 200, data: <detail json> } or { status: 400/404, data: { error } }
 */

import { questFindQuestPathBroker } from '@dungeonmaster/orchestrator';
import { readFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { locationsWardResultsPathFindBroker } from '@dungeonmaster/shared/brokers';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { questWardDetailParamsContract } from '../../../contracts/quest-ward-detail-params/quest-ward-detail-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestWardDetailResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  const parsedParams = questWardDetailParamsContract.safeParse(params);
  if (!parsedParams.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: 'questId and wardResultId are required' },
    });
  }

  const { questId, wardResultId } = parsedParams.data;

  try {
    const { questPath } = await questFindQuestPathBroker({ questId });
    const detailFilePath = join(
      locationsWardResultsPathFindBroker({ questFolderPath: questPath }),
      `${wardResultId}.json`,
    );
    const contents = await readFile(filePathContract.parse(detailFilePath));
    const detail: unknown = JSON.parse(contents);
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: detail });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ward detail not available';
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.notFound,
      data: { error: message },
    });
  }
};
