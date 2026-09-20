/**
 * PURPOSE: The surface `dungeonmaster siegelense capacity --spec <specName> [--pool <n>] [--json]`
 * serves — concise token-efficient human summary on stdout by default through `capacityAnswerRenderTransformer`,
 * or the raw `CapacityAnswer` JSON document when `isJson` is true. Writes through `process.stdout.write`,
 * never `console.log`. Starts no instance — `capacityReadBroker` resolves everything off the registry,
 * the host, and the asset tree.
 *
 * USAGE:
 * await SiegelenseCapacityResponder({ specName, poolSize: null, isJson: false });
 * // Writes the CapacityAnswer as human summary
 *
 * await SiegelenseCapacityResponder({ specName, poolSize: null, isJson: true });
 * // Writes the CapacityAnswer as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { capacityReadBroker } from '../../../brokers/capacity/read/capacity-read-broker';
import type { ProfilePoolSize } from '../../../contracts/profile-pool-size/profile-pool-size-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { capacityAnswerRenderTransformer } from '../../../transformers/capacity-answer-render/capacity-answer-render-transformer';

export const SiegelenseCapacityResponder = async ({
  specName,
  poolSize,
  isJson = false,
  human,
}: {
  specName: SpecName;
  poolSize: ProfilePoolSize | null;
  isJson?: boolean;
  human?: boolean;
}): Promise<AdapterResult> => {
  const answer = await capacityReadBroker({ specName, poolSize });
  const shouldOutputJson = human === undefined ? isJson : !human;

  process.stdout.write(
    shouldOutputJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : capacityAnswerRenderTransformer({ answer }),
  );

  return adapterResultContract.parse({ success: true });
};
