/**
 * PURPOSE: Resolves one step's screenshot path inside an already run-namespaced shots directory.
 * Takes `shotsDir` — `locationsRunPathsFindBroker`'s output, already keyed by run id — rather than a
 * bare instance path, because step numbering restarts at 1 per run: a resolver that joined the step
 * index straight onto the instance's evidence root would let `run_2`'s `step4.png` silently overwrite
 * `run_1`'s. `name` is what a `screenshot` step carries (siegelense-tooling.md line 2516): omitted, an
 * acting step's unasked capture falls back to the index-derived `step4.png`; passed, the caller's own
 * filename lands inside the same run-namespaced directory, so the run-level collision guard above
 * still holds without forcing every capture through the generic name.
 *
 * USAGE:
 * locationsShotPathFindBroker({
 *   shotsDir: '/repo/.../runs/run_2',
 *   step: 4,
 * });
 * // Returns AbsoluteFilePath '/repo/.../runs/run_2/step4.png'
 *
 * locationsShotPathFindBroker({
 *   shotsDir: '/repo/.../runs/run_2',
 *   step: 4,
 *   name: FileNameStub({ value: 'after-create.png' }),
 * });
 * // Returns AbsoluteFilePath '/repo/.../runs/run_2/after-create.png'
 */

import { join } from '#gateway/node/path';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';

export const locationsShotPathFindBroker = ({
  shotsDir,
  step,
  name,
}: {
  shotsDir: string;
  step: number;
  name?: string;
}): string => {
  const fileName =
    name ?? `${evidenceFileStatics.naming.shotPrefix}${step}${evidenceFileStatics.extensions.shot}`;
  const joined = join(shotsDir, fileName);

  return joined;
};
