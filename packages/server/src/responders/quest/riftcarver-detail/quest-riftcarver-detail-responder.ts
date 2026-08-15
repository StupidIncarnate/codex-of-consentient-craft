/**
 * PURPOSE: Handles GET requests for a single riftcarver result's carve log — validates the questId +
 * riftcarverResultId params, resolves the quest folder, reads
 * <questFolder>/riftcarver-results/<riftcarverResultId>.log, and returns it wrapped in a JSON envelope
 * (`{ log: string }`) rather than raw `text/plain`, since the web side parses every response through a
 * zod contract and a JSON envelope keeps that boundary rule intact. Returns 404 when the log file is
 * absent. Reach for this over QuestWardDetailResponder when the persisted artifact is a plain-text
 * stream log rather than a structured JSON detail blob.
 *
 * USAGE:
 * const result = await QuestRiftcarverDetailResponder({ params: { questId, riftcarverResultId } });
 * // Returns { status: 200, data: { log: '...' } } or { status: 400/404, data: { error } }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { questRiftcarverDetailParamsContract } from '../../../contracts/quest-riftcarver-detail-params/quest-riftcarver-detail-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestRiftcarverDetailResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  const parsedParams = questRiftcarverDetailParamsContract.safeParse(params);
  if (!parsedParams.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: 'questId and riftcarverResultId are required' },
    });
  }

  const { questId, riftcarverResultId } = parsedParams.data;

  try {
    const { questPath } = await orchestratorFindQuestPathAdapter({ questId });
    const logFilePath = pathJoinAdapter({
      paths: [questPath, locationsStatics.quest.riftcarverResultsDir, `${riftcarverResultId}.log`],
    });
    const contents = await fsReadFileAdapter({ filepath: filePathContract.parse(logFilePath) });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { log: contents },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Riftcarver detail not available';
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.notFound,
      data: { error: message },
    });
  }
};
