/**
 * PURPOSE: The surface `dungeonmaster siegelense snapshots --instance <id>` serves — writes one
 * `SnapshotsAnswer` to stdout as JSON. Reads the registry FIRST and throws `InstanceUnknownError` on
 * a miss, the same check `SiegelenseKillResponder`/`SiegelenseRunResponder` make: agents read exit
 * codes to decide what happened, so an id the registry never held refuses (exit 1) rather than
 * answering a typed `instanceState: 'unknown'` reading (exit 0). `snapshotListBroker` itself is
 * untouched and still answers `'pruned'`/`'dead'`/`'killed'` normally — every one of those DOES have
 * a registry row, so this check passes it straight through (spec line 2319: "`pruned` and `unknown`
 * are real answers, not empty results" still holds for every state this check does not intercept). A
 * failure the broker DOES throw — an index that exists and cannot be parsed — propagates unchanged;
 * the CLI entry point turns an uncaught throw into stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseSnapshotsResponder({ instanceId: InstanceIdStub() });
 * // Writes the SnapshotsAnswer as one JSON document to stdout, or throws InstanceUnknownError first
 */

import { stdout } from '#gateway/node/process';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { snapshotListBroker } from '../../../brokers/snapshot/list/snapshot-list-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { snapshotsAnswerRenderTransformer } from '../../../transformers/snapshots-answer-render/snapshots-answer-render-transformer';

export const SiegelenseSnapshotsResponder = async ({
  instanceId,
  isJson = false,
}: {
  instanceId: InstanceId;
  isJson?: boolean | undefined;
}): Promise<void> => {
  const registry = await registryReadBroker();
  const isKnownInstance = registry.instances.some((candidate) => candidate.id === instanceId);
  if (!isKnownInstance) {
    throw new InstanceUnknownError({ instanceId });
  }

  const answer = await snapshotListBroker({ instanceId });
  stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : snapshotsAnswerRenderTransformer({
          answer,
          nowMs: epochMsContract.parse(Date.now()),
        }),
  );
};
