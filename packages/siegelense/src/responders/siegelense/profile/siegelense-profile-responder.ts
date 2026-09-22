/**
 * PURPOSE: The surface `dungeonmaster siegelense profile --spec <specName> [--json]` serves —
 * concise token-efficient human summary on stdout by default through `profileAnswerRenderTransformer`,
 * or the raw `SpecProfile` JSON document when `isJson` is true. Writes through `process.stdout.write`,
 * never `console.log`. Starts no instance — `profileReadBroker` resolves everything off the asset tree.
 *
 * USAGE:
 * await SiegelenseProfileResponder({ specName: SpecNameStub({ value: 'dungeonmaster-stack' }), isJson: false });
 * // Writes that spec's SpecProfile as concise human summary
 *
 * await SiegelenseProfileResponder({ specName: SpecNameStub({ value: 'dungeonmaster-stack' }), isJson: true });
 * // Writes that spec's SpecProfile as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { profileReadBroker } from '../../../brokers/profile/read/profile-read-broker';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { profileAnswerRenderTransformer } from '../../../transformers/profile-answer-render/profile-answer-render-transformer';

export const SiegelenseProfileResponder = async ({
  specName,
  isJson = false,
}: {
  specName: SpecName;
  isJson?: boolean;
}): Promise<AdapterResult> => {
  const profile = await profileReadBroker({ specName });

  process.stdout.write(
    isJson
      ? `${JSON.stringify(profile, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : profileAnswerRenderTransformer({ profile }),
  );

  return adapterResultContract.parse({ success: true });
};
