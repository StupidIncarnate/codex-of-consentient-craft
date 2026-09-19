/**
 * PURPOSE: The surface `dungeonmaster siegelense status [--instance <id>]` serves — the fleet or
 * one-instance table through `statusAnswerRenderTransformer` by default (when `human` is true or
 * omitted), or one JSON document on stdout (the raw `StatusAnswer`) when `human` is false (opted
 * into with `--json`). Writes through `process.stdout.write`, never `console.log`, matching
 * `SiegelenseFleetResponder`. Never fetches per-row detail for a fleet listing itself —
 * `statusReadBroker`'s own no-browsing rule already withholds evidence and `lastStep` for every row
 * except a named instance, and this responder passes `instanceId` straight through rather than making
 * N extra calls to fill in a prettier table. Also passes `instanceId` through to the RENDERER —
 * `statusReadBroker` answers `instances: []` both for an empty fleet and for an unrecognised named id,
 * and only the renderer, told which question was asked, can tell those two apart in the text a
 * person reads. `human` defaults to `true` in the destructuring. **The refusal for `--human` on a call
 * with no renderer lives in `SiegelenseFlow`'s route table, not here** — this responder only ever
 * renders when told to.
 *
 * USAGE:
 * await SiegelenseStatusResponder({ instanceId: null, human: true });
 * // Writes the fleet's rendered table
 *
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
  branch = null,
  since = null,
  human = true,
}: {
  instanceId: InstanceId | null;
  branch?: string | null | undefined;
  since?: '1h' | '6h' | '1d' | null | undefined;
  human?: boolean | undefined;
}): Promise<AdapterResult> => {
  const answer = await statusReadBroker({ instanceId, branch, since });
  process.stdout.write(
    human
      ? statusAnswerRenderTransformer({ answer, instanceId })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );
  return adapterResultContract.parse({ success: true });
};
