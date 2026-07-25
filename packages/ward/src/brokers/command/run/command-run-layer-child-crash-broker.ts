/**
 * PURPOSE: Layer of commandRunLayerMultiBroker — turns a child ward process that produced no
 * readable result into one crashed ProjectResult per requested check type. A child can exit
 * without a loadable result (spawn failure, kill, unwritable `.ward/`), and dropping that result
 * would report the package as passing; a crashed result makes the run fail loudly instead.
 *
 * USAGE:
 * const checks = commandRunLayerChildCrashBroker({ projectFolder, checkTypes: ['lint'], exitCode, output });
 * // Returns CheckResult[] — one failing check per requested type, each carrying the child's output tail
 */

import type { ErrorMessage, ExitCode } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import type { CheckResult } from '../../../contracts/check-result/check-result-contract';
import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { projectResultContract } from '../../../contracts/project-result/project-result-contract';
import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import { rawOutputCapStatics } from '../../../statics/raw-output-cap/raw-output-cap-statics';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';

export const commandRunLayerChildCrashBroker = ({
  projectFolder,
  checkTypes,
  exitCode,
  output,
}: {
  projectFolder: ProjectFolder;
  checkTypes: CheckType[];
  exitCode: ExitCode | null;
  output: ErrorMessage;
}): CheckResult[] => {
  const resolvedExitCode =
    exitCode === null ? wardExitCodeStatics.exitCodes.failing : Number(exitCode);
  const tail = String(output).slice(-rawOutputCapStatics.cap.maxChars);
  const banner = `ward child process for ${projectFolder.name} exited with code ${String(resolvedExitCode)} and wrote no readable result file`;

  const projectResult = projectResultContract.parse({
    projectFolder,
    status: 'fail',
    errors: [],
    testFailures: [],
    rawOutput: rawOutputContract.parse({
      stdout: tail,
      stderr: banner,
      exitCode: resolvedExitCode,
    }),
  });

  return checkTypes.map((checkType) =>
    checkResultBuildTransformer({ checkType, projectResults: [projectResult] }),
  );
};
