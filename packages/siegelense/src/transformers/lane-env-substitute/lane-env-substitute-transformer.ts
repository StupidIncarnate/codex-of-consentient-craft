/**
 * PURPOSE: Substitutes `{apiPort}`/`{webPort}` into every VALUE of one lane env record, keeping its
 * keys unchanged — the per-record half of what `lane-boot-broker` does to a spec's `env` before
 * spawning: this file substitutes one record, the broker merges several. Pure, so a spec's env
 * templates are testable without a process. Built with `reduce`, never `Object.fromEntries` over a
 * `.map()` array literal — `Object.fromEntries`' tuple overload only matches when TypeScript can see
 * a literal 2-tuple, and a `.map()` callback returning `[key, value]` infers a plain array instead,
 * silently falling to its `any`-returning overload.
 *
 * USAGE:
 * laneEnvSubstituteTransformer({
 *   env: LaneSpecStub().env,
 *   ports: PortPairStub(),
 * });
 * // Returns the same keys, each value with {apiPort}/{webPort} substituted
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { lanePlaceholderSubstituteTransformer } from '../lane-placeholder-substitute/lane-placeholder-substitute-transformer';
import type { LaneSpec } from '../../contracts/lane-spec/lane-spec-contract';
import type { PortPair } from '../../contracts/port-pair/port-pair-contract';

export const laneEnvSubstituteTransformer = ({
  env,
  ports,
}: {
  env: LaneSpec['env'];
  ports: PortPair;
}): Record<PropertyKey, ContentText> =>
  Object.fromEntries(
    Object.entries(env).map(([key, value]): [PropertyKey, ContentText] => [
      key,
      lanePlaceholderSubstituteTransformer({
        template: value ?? contentTextContract.parse(''),
        ports,
      }),
    ]),
  );
