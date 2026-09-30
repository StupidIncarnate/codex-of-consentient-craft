/**
 * PURPOSE: Layer of commandRunBroker — runs the platform-crossing and duplicate-install checks ONCE
 * for the whole repo, folding every violation into a single lint `ProjectResult` scoped to the repo
 * root. Called once from `commandRunBroker`, never from inside `singlePackageLayerBroker`'s or
 * `multiPackageLayerBroker`'s per-package loop: both checks walk the WHOLE repo in one pass
 * regardless of how many packages are in scope, so calling them per package would repeat the same
 * walk once per package for no new information. `hasPlatformDedupeScopeTriggerGuard` decides whether
 * a SCOPED run bothers to pay for that walk at all — but even when it does, the two checks below
 * still walk the whole repo; only the decision to call them is scoped, never their own reach.
 *
 * USAGE:
 * await platformDedupeCheckLayerBroker({ rootPath, checkTypes: ['lint'], passthrough: undefined });
 * // Returns a failing ProjectResult when either check found a violation, undefined when the check
 * // did not run (lint not selected, or a scoped run that named neither a package.json nor a gateway
 * // file) or ran clean
 */

import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import { errorEntryContract } from '../../../contracts/error-entry/error-entry-contract';
import { platformCrossingCheckBroker } from '../../platform-crossing/check/platform-crossing-check-broker';
import { duplicateInstallCheckBroker } from '../../duplicate-install/check/duplicate-install-check-broker';
import { platformCrossingViolationDisplayTransformer } from '../../../transformers/platform-crossing-violation-display/platform-crossing-violation-display-transformer';
import { duplicateInstallViolationDisplayTransformer } from '../../../transformers/duplicate-install-violation-display/duplicate-install-violation-display-transformer';
import { hasPlatformDedupeScopeTriggerGuard } from '../../../guards/has-platform-dedupe-scope-trigger/has-platform-dedupe-scope-trigger-guard';

// Neither violation shape names a line/column — both checks report at PACKAGE granularity, never a
// single line — so this is the same "no location" sentinel `resultToListTransformer` and
// `resultToDetailTransformer` already special-case (`error.line === 0` omits the location suffix).
const NO_LOCATION = 0;
const PLATFORM_CROSSING_RULE = 'platform-crossing';
const DUPLICATE_INSTALL_RULE = 'duplicate-install';
// Not a real file — the closest thing either check reports is the offending package's own name,
// which is what the display transformer's own text already leads with.
const REPO_CHECK_PROJECT_NAME = '(platform + dedupe)';

export const platformDedupeCheckLayerBroker = async ({
  rootPath,
  checkTypes,
  passthrough,
}: {
  rootPath: string;
  checkTypes: CheckType[];
  passthrough: WardConfig['passthrough'];
}): Promise<ProjectResult | undefined> => {
  if (!checkTypes.includes('lint')) {
    return undefined;
  }

  if (!hasPlatformDedupeScopeTriggerGuard({ passthrough })) {
    return undefined;
  }

  const repoPath = rootPath;
  const [platformViolations, duplicateViolations] = await Promise.all([
    platformCrossingCheckBroker({ rootPath: repoPath }),
    duplicateInstallCheckBroker({ rootPath: repoPath }),
  ]);

  const platformErrors = platformViolations.map((violation) =>
    errorEntryContract.parse({
      filePath: violation.packageName,
      line: NO_LOCATION,
      column: NO_LOCATION,
      message: platformCrossingViolationDisplayTransformer({ violation }),
      rule: PLATFORM_CROSSING_RULE,
      severity: 'error',
    }),
  );

  const duplicateErrors = duplicateViolations.map((violation) =>
    errorEntryContract.parse({
      filePath: violation.packageName,
      line: NO_LOCATION,
      column: NO_LOCATION,
      message: duplicateInstallViolationDisplayTransformer({ violation }),
      rule: DUPLICATE_INSTALL_RULE,
      severity: 'error',
    }),
  );

  const errors = [...platformErrors, ...duplicateErrors];

  if (errors.length === 0) {
    return undefined;
  }

  return projectResultContract.parse({
    projectFolder: { name: REPO_CHECK_PROJECT_NAME, path: rootPath },
    status: 'fail',
    errors,
    testFailures: [],
  });
};
