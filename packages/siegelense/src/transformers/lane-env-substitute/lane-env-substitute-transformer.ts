/**
 * PURPOSE: Substitutes every placeholder `lanePlaceholderSubstituteTransformer` knows into every
 * VALUE of one lane env record, keeping its keys unchanged, then resolves any value that still
 * looks like a repo-relative path (D4: a consumer's own `devServer.e2e.processes[].env` names a
 * fake-CLI binary this way) against `repoRoot` — the per-record half of what `lane-boot-broker` does
 * to a spec's `env` before spawning: this file substitutes one record, the broker merges several.
 * Pure, so a spec's env templates are testable without a process. The `.map()` callback's return
 * type is annotated as a literal 2-tuple — `Object.fromEntries`' typed overload only matches when
 * TypeScript can see that; an unannotated `[key, value]` return infers a plain array instead and
 * silently falls to the untyped, `any`-returning overload.
 *
 * USAGE:
 * laneEnvSubstituteTransformer({
 *   env: LaneSpecStub().env,
 *   ports: PortPairStub(),
 *   home: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' }),
 *   claudeQueueDir: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/claude-queue' }),
 *   wardQueueDir: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/ward-queue' }),
 *   apiWorkspace: ContentTextStub({ value: '@dungeonmaster/server' }),
 *   webWorkspace: ContentTextStub({ value: '@dungeonmaster/web' }),
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 * });
 * // Returns the same keys, each value with every known placeholder substituted and any relative
 * // path resolved against /repo
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { isRelativePathEnvValueGuard } from '../../guards/is-relative-path-env-value/is-relative-path-env-value-guard';
import { lanePlaceholderSubstituteTransformer } from '../lane-placeholder-substitute/lane-placeholder-substitute-transformer';
import type { LaneSpec } from '../../contracts/lane-spec/lane-spec-contract';
import type { PortPair } from '../../contracts/port-pair/port-pair-contract';

export const laneEnvSubstituteTransformer = ({
  env,
  ports,
  home,
  claudeQueueDir,
  wardQueueDir,
  apiWorkspace,
  webWorkspace,
  repoRoot,
}: {
  env: LaneSpec['env'];
  ports: PortPair;
  home: AbsoluteFilePath;
  claudeQueueDir: AbsoluteFilePath;
  wardQueueDir: AbsoluteFilePath;
  apiWorkspace: ContentText;
  webWorkspace: ContentText;
  repoRoot: AbsoluteFilePath;
}): Record<PropertyKey, ContentText> =>
  Object.fromEntries(
    Object.entries(env).map(([key, value]): [PropertyKey, ContentText] => {
      const substituted = lanePlaceholderSubstituteTransformer({
        template: value ?? contentTextContract.parse(''),
        ports,
        home,
        claudeQueueDir,
        wardQueueDir,
        apiWorkspace,
        webWorkspace,
      });

      return [
        key,
        isRelativePathEnvValueGuard({ value: substituted })
          ? contentTextContract.parse(`${repoRoot}/${substituted}`)
          : substituted,
      ];
    }),
  );
