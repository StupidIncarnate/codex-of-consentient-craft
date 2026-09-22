/**
 * PURPOSE: The surface `dungeonmaster siegelense status [--instance <id>]` serves — the fleet or
 * one-instance table through `statusAnswerRenderTransformer` by default (when `isJson` is false or
 * omitted), or one JSON document on stdout (the raw `StatusAnswer`) when `isJson` is true (opted
 * into with `--json`). Writes through `process.stdout.write`, never `console.log`, matching
 * `SiegelenseFleetResponder`. Never fetches per-row detail for a fleet listing itself —
 * `statusReadBroker`'s own no-browsing rule already withholds evidence and `lastStep` for every row
 * except a named instance, and this responder passes `instanceId` straight through rather than making
 * N extra calls to fill in a prettier table. Also passes `instanceId` through to the RENDERER —
 * `statusReadBroker` answers `instances: []` both for an empty fleet and for an unrecognised named id,
 * and only the renderer, told which question was asked, can tell those two apart in the text a
 * person reads. `isJson` defaults to `false` in the destructuring. **The refusal for `--human` lives
 * in `statusArgsParseTransformer`'s own known-flag set**, which rejects it as an unknown flag before
 * argv ever reaches this responder — this responder only ever renders when told to.
 *
 * USAGE:
 * await SiegelenseStatusResponder({ instanceId: null, isJson: false });
 * // Writes the fleet's rendered table
 *
 * await SiegelenseStatusResponder({ instanceId: null, isJson: true });
 * // Writes the fleet's StatusAnswer as one JSON document
 *
 * await SiegelenseStatusResponder({ instanceId: InstanceIdStub(), isJson: false });
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
  since = instanceId === null ? '6h' : null,
  isJson = false,
}: {
  instanceId: InstanceId | null;
  branch?: string | null | undefined;
  since?: '1h' | '6h' | '1d' | 'beginning' | null | undefined;
  isJson?: boolean | undefined;
}): Promise<AdapterResult> => {
  const answer = await statusReadBroker({ instanceId, branch, since });
  process.stdout.write(
    isJson
      ? `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : statusAnswerRenderTransformer({ answer, instanceId }),
  );
  return adapterResultContract.parse({ success: true });
};
