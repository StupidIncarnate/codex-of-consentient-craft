/**
 * PURPOSE: Resolves one step's screenshot path inside an already run-namespaced shots directory.
 * Takes `shotsDir` — `locationsRunPathsFindBroker`'s output, already keyed by run id — rather than a
 * bare instance path, because step numbering restarts at 1 per run: a resolver that joined the step
 * index straight onto the instance's evidence root would let `run_2`'s `step4.png` silently overwrite
 * `run_1`'s.
 *
 * USAGE:
 * locationsShotPathFindBroker({
 *   shotsDir: AbsoluteFilePathStub({ value: '/repo/.siegelense/.../runs/run_2' }),
 *   step: StepIndexStub({ value: 4 }),
 * });
 * // Returns AbsoluteFilePath '/repo/.siegelense/.../runs/run_2/step4.png'
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';

export const locationsShotPathFindBroker = ({
  shotsDir,
  step,
}: {
  shotsDir: AbsoluteFilePath;
  step: StepIndex;
}): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [
      shotsDir,
      `${locationsStatics.siegelense.shotPrefix}${step}${locationsStatics.siegelense.shotExtension}`,
    ],
  });

  return absoluteFilePathContract.parse(joined);
};
