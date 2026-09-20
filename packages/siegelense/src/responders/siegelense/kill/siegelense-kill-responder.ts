/**
 * PURPOSE: The surface `dungeonmaster siegelense kill --instance <id>` serves — tears an instance
 * down and writes the resulting `KillResult` to stdout as one JSON document. Reads the registry
 * FIRST and throws `InstanceUnknownError` on a miss, carrying across the check
 * `siegelense-handle-responder.ts:222-243` (the deleted MCP tool's own kill branch) made:
 * `instanceKillBroker` falls back to a deterministic socket path for an id the registry never
 * held, so without this check a typo answers `DriverUnreachableError` — a driver problem — instead
 * of what it actually is, an id that never existed (siegelense-tooling.md line 2207: "no instance
 * by that id, ever. A mistyped or misremembered id, not a walk that found nothing"). Accepts an
 * already-dead id: `instanceReleaseBroker` marks a killed row rather than deleting it, so this
 * check still passes and the broker runs its orphan-reap path against that row's heartbeat file
 * (packages/siegelense/CLAUDE.md — "kill accepts an already-dead instance's id too").
 *
 * USAGE:
 * await SiegelenseKillResponder({ instanceId: InstanceIdStub() });
 * // Writes the KillResult as one JSON document to stdout, or throws InstanceUnknownError first
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { instanceKillBroker } from '../../../brokers/instance/kill/instance-kill-broker';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { killAnswerRenderTransformer } from '../../../transformers/kill-answer-render/kill-answer-render-transformer';

export const SiegelenseKillResponder = async ({
  instanceId,
  json = false,
}: {
  instanceId: InstanceId;
  json?: boolean | undefined;
}): Promise<AdapterResult> => {
  const registry = await registryReadBroker();
  const isKnownInstance = registry.instances.some((candidate) => candidate.id === instanceId);
  if (!isKnownInstance) {
    throw new InstanceUnknownError({ instanceId });
  }

  const result = await instanceKillBroker({ instanceId });
  process.stdout.write(
    json
      ? `${JSON.stringify(result, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : killAnswerRenderTransformer({ result }),
  );
  return adapterResultContract.parse({ success: true });
};
