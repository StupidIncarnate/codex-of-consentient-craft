/**
 * PURPOSE: The human surface `dungeonmaster siegelense status [--instance <id>]` serves — the fleet
 * block for `instanceId: null`, or one instance in full for a named id, rendered through
 * `statusAnswerRenderTransformer` and written to stdout. Writes through `process.stdout.write`,
 * never `console.log`, matching `SiegelenseFleetResponder`. Never fetches per-row detail for a
 * fleet listing itself — `statusReadBroker`'s own no-browsing rule already withholds evidence and
 * `lastStep` for every row except a named instance, and this responder passes `instanceId` straight
 * through rather than making N extra calls to fill in a prettier table. Also passes `instanceId`
 * through to the RENDERER — `statusReadBroker` answers `instances: []` both for an empty fleet and
 * for an unrecognised named id, and only the renderer, told which question was asked, can tell those
 * two apart in the text a person reads.
 *
 * USAGE:
 * await SiegelenseStatusResponder({ instanceId: null });
 * // Writes the fleet block: monitored vocabulary, machine reading, one line per instance
 *
 * await SiegelenseStatusResponder({ instanceId: InstanceIdStub() });
 * // Writes that one instance in full
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { statusReadBroker } from '../../../brokers/status/read/status-read-broker';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { statusAnswerRenderTransformer } from '../../../transformers/status-answer-render/status-answer-render-transformer';

export const SiegelenseStatusResponder = async ({
  instanceId,
}: {
  instanceId: InstanceId | null;
}): Promise<AdapterResult> => {
  const answer = await statusReadBroker({ instanceId });
  process.stdout.write(statusAnswerRenderTransformer({ answer, instanceId }));
  return adapterResultContract.parse({ success: true });
};
