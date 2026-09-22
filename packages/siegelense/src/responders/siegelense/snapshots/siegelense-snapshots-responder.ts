/**
 * PURPOSE: The surface `dungeonmaster siegelense snapshots --instance <id>` serves — writes one
 * `SnapshotsAnswer` to stdout as JSON. Carries NO registry-miss check, like
 * `SiegelenseResultsResponder` and unlike `SiegelenseKillResponder`: `snapshotListBroker` already
 * resolves an unrecognised id to a real `instanceState: 'unknown'` answer with no rows (spec line
 * 2319: "`pruned` and `unknown` are real answers, not empty results"), so that id writes its JSON
 * document and exits 0 rather than throwing. A failure the broker DOES throw — an index that exists
 * and cannot be parsed — propagates unchanged; the CLI entry point turns an uncaught throw into
 * stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseSnapshotsResponder({ instanceId: InstanceIdStub() });
 * // Writes the SnapshotsAnswer as one JSON document to stdout
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { snapshotListBroker } from '../../../brokers/snapshot/list/snapshot-list-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { snapshotsAnswerRenderTransformer } from '../../../transformers/snapshots-answer-render/snapshots-answer-render-transformer';

export const SiegelenseSnapshotsResponder = async ({
  instanceId,
  isJson = false,
}: {
  instanceId: InstanceId;
  isJson?: boolean | undefined;
}): Promise<AdapterResult> => {
  const answer = await snapshotListBroker({ instanceId });
  process.stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : snapshotsAnswerRenderTransformer({
          answer,
          nowMs: epochMsContract.parse(Date.now()),
        }),
  );
  return adapterResultContract.parse({ success: true });
};
