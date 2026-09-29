/**
 * PURPOSE: Pulls every repo-relative path a lane's process commands name — `packages/web/dist` out
 * of `vite preview --outDir packages/web/dist`, the value half of a `--flag=path` token — so
 * `servedBuildStaleReadBroker` can ask git which of them is a gitignored build folder. It reads
 * the lane's OWN commands rather than assuming any package layout: a consumer repo's served folder
 * is wherever its own command says. A token is a path candidate only when it holds a `/`; an
 * absolute path, one climbing out with `..`, an npm scope (`@scope/name`), and one still carrying a `{token}`, a `$VAR` or a
 * quote are dropped, because git cannot answer for any of them. A leading `./` and a trailing `/`
 * are trimmed so one folder written two ways is asked about once.
 *
 * USAGE:
 * laneCommandPathsTransformer({ spec: LaneSpecStub() });
 * // Returns ['packages/web/vite.config.ts', 'packages/web/dist'] for a vite preview process
 */

import { repoRelativePathContract } from '@dungeonmaster/shared/contracts';
import type { RepoRelativePath } from '@dungeonmaster/shared/contracts';

import type { LaneSpec } from '../../contracts/lane-spec/lane-spec-contract';

const UNRESOLVABLE_PATTERN = /[{}$'"`\\]/u;

export const laneCommandPathsTransformer = ({ spec }: { spec: LaneSpec }): RepoRelativePath[] => {
  const tokens = spec.processes.flatMap((laneProcess) =>
    [laneProcess.command, ...laneProcess.args].flatMap((part) => part.split(/\s+/u)),
  );

  const paths = tokens
    .map((token) => (token.includes('=') ? token.slice(token.indexOf('=') + 1) : token))
    .map((value) => value.replace(/^(?:\.\/)+/u, '').replace(/\/+$/u, ''))
    .filter(
      (value) =>
        value.includes('/') &&
        !value.startsWith('/') &&
        !value.startsWith('-') &&
        !value.startsWith('..') &&
        !value.startsWith('@') &&
        !UNRESOLVABLE_PATTERN.test(value),
    );

  return [...new Set(paths)].map((value) => repoRelativePathContract.parse(value));
};
