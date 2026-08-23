/**
 * PURPOSE: Normalizes every passthrough path to the ONE form ward's matcher understands —
 * repo-relative, no `./` prefix. Call it once, before anything reads `config.passthrough`.
 *
 * USAGE:
 * passthroughNormalizeTransformer({ passthrough: config.passthrough, rootPath });
 * // ['./packages/ward/src/a.ts', '<rootPath>/packages/ward/src/b.ts'] => ['packages/ward/src/a.ts', 'packages/ward/src/b.ts']
 *
 * WHY IT EXISTS: `hasPassthroughMatchGuard` matches a path against a package prefix with
 * `startsWith('packages/<name>/')`. A `./` prefix and an absolute path both fail that test, so every
 * path in the list matched no package, no child ward was spawned, and the run reported
 * `lint: WARN 0 files run` at **exit code 0**. A scoped run that checked nothing looked exactly like
 * a scoped run that passed.
 *
 * THE TWO BROKEN FORMS WERE THE TWO THE ORCHESTRATOR MANDATES. `plannerMinionStatics` tells every
 * planner "`FILES` paths start with `./` or are absolute", and `workerMinionStatics` turns that same
 * list into the worker's ward scope verbatim. So the per-chunk check — the only check a round runs
 * before its reviewer — passed without executing on any discipline. Measured on a real quest: a
 * worker recorded the no-op in its own commit body and the round still went green.
 *
 * NORMALIZING BEATS REJECTING. All three forms name the same file and a reader cannot tell them
 * apart, so the fix belongs where the ambiguity is resolved rather than in five prompts that each
 * have to remember the exact spelling.
 *
 * IT RUNS AFTER THE GIT SCOPE LAYER, deliberately. `commandRunLayerGitScopeBroker` writes
 * `passthrough` from `git diff --name-only`, which is already repo-relative, so this is a no-op on
 * that path — one call site covers both `--changed`/`--staged` and an explicit `-- <files>` list
 * rather than trusting git's output format forever.
 *
 * A path outside `rootPath` is returned UNCHANGED. It names something this run cannot reach, and a
 * silently rewritten path is the failure this transformer exists to end.
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  wardConfigContract,
  type WardConfig,
} from '../../contracts/ward-config/ward-config-contract';

export const passthroughNormalizeTransformer = ({
  passthrough,
  rootPath,
}: {
  passthrough: WardConfig['passthrough'];
  rootPath: AbsoluteFilePath;
}): WardConfig['passthrough'] => {
  if (passthrough === undefined) {
    return undefined;
  }

  const rootPrefix = `${String(rootPath)}/`;
  const dotSlash = './';

  return passthrough.map((arg) => {
    const raw = String(arg);
    const repoRelative = raw.startsWith(rootPrefix) ? raw.slice(rootPrefix.length) : raw;
    const withoutDotSlash = repoRelative.startsWith(dotSlash)
      ? repoRelative.slice(dotSlash.length)
      : repoRelative;

    return wardConfigContract.shape.passthrough.unwrap().element.parse(withoutDotSlash);
  });
};
