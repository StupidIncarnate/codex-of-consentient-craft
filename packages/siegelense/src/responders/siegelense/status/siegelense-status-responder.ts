/**
 * PURPOSE: The surface `dungeonmaster siegelense status [--instance <id>]` serves — one JSON
 * document on stdout by default (the raw `StatusAnswer`), or the fleet/one-instance table through
 * `statusAnswerRenderTransformer` when `human` is true (siegelense-tooling.md's `--human` opt-out).
 * Writes through `process.stdout.write`, never `console.log`, matching `SiegelenseFleetResponder`.
 * Never fetches per-row detail for a fleet listing itself — `statusReadBroker`'s own no-browsing
 * rule already withholds evidence and `lastStep` for every row except a named instance, and this
 * responder passes `instanceId` straight through rather than making N extra calls to fill in a
 * prettier table. Also passes `instanceId` through to the RENDERER — `statusReadBroker` answers
 * `instances: []` both for an empty fleet and for an unrecognised named id, and only the renderer,
 * told which question was asked, can tell those two apart in the text a person reads. `human`
 * defaults to `false` in the destructuring: `SiegelenseFlow`'s current route calls this responder
 * with no `human` key at all, and that call site belongs to the route table (a later work item), not
 * to this file. **The refusal for `--human` on a call with no renderer lives in `SiegelenseFlow`'s
 * route table, not here** — this responder only ever renders when told to.
 *
 * USAGE:
 * await SiegelenseStatusResponder({ instanceId: null, human: false });
 * // Writes the fleet's StatusAnswer as one JSON document
 *
 * await SiegelenseStatusResponder({ instanceId: InstanceIdStub(), human: true });
 * // Writes that one instance in full, as the rendered table
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { statusReadBroker } from '../../../brokers/status/read/status-read-broker';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { statusAnswerRenderTransformer } from '../../../transformers/status-answer-render/status-answer-render-transformer';

export const SiegelenseStatusResponder = async ({
  instanceId,
  human = false,
}: {
  instanceId: InstanceId | null;
  human: boolean;
}): Promise<AdapterResult> => {
  const answer = await statusReadBroker({ instanceId });
  process.stdout.write(
    human
      ? statusAnswerRenderTransformer({ answer, instanceId })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );
  return adapterResultContract.parse({ success: true });
};
