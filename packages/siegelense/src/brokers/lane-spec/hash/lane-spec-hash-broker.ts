/**
 * PURPOSE: The lane spec's content hash — what a later profile keys measurement on, so adding a
 * process to a spec changes this and a stale profile is caught by construction rather than by
 * someone remembering to invalidate it (siegelense-tooling.md line 1703). This is the composition
 * point the plan calls "the content-hash transformer": a transformer cannot reach `crypto` itself
 * (its allowed imports stop at contracts/statics/errors/guards/transformers), so the canonicalizing
 * half stays a pure transformer and this broker is what carries its output across the one boundary
 * that needs `createHash`, then brands the result. Reach for this over calling
 * `laneSpecCanonicalJsonTransformer` directly — every other caller wants the
 * finished `SpecHash`, never the intermediate JSON or the raw digest.
 *
 * USAGE:
 * laneSpecHashBroker({ spec: LaneSpecStub() });
 * // Returns a SpecHash — the sha256 hex digest of the spec's canonical JSON
 */

import { createHash } from '#gateway/node/crypto';

import type { LaneSpec } from '../../../contracts/lane-spec/lane-spec-contract';
import { laneSpecCanonicalJsonTransformer } from '../../../transformers/lane-spec-canonical-json/lane-spec-canonical-json-transformer';

const HASH_ALGORITHM = 'sha256';

export const laneSpecHashBroker = ({ spec }: { spec: LaneSpec }): string => {
  const canonicalJson = laneSpecCanonicalJsonTransformer({ spec });
  const digest = createHash(HASH_ALGORITHM).update(String(canonicalJson)).digest('hex');
  return digest;
};
