/**
 * PURPOSE: The lane spec's content hash — what a later profile keys measurement on, so adding a
 * process to a spec changes this and a stale profile is caught by construction rather than by
 * someone remembering to invalidate it (siegelense-tooling.md line 1703). This is the composition
 * point the plan calls "the content-hash transformer": a transformer cannot reach `crypto` itself
 * (its allowed imports stop at contracts/statics/errors/guards/transformers), so the canonicalizing
 * half stays a pure transformer and this broker is what carries its output across the one boundary
 * that needs the `crypto` adapter, then brands the result. Reach for this over calling
 * `laneSpecCanonicalJsonTransformer` or `cryptoHashAdapter` directly — every other caller wants the
 * finished `SpecHash`, never the intermediate JSON or the raw digest.
 *
 * USAGE:
 * laneSpecHashBroker({ spec: LaneSpecStub() });
 * // Returns a SpecHash — the sha256 hex digest of the spec's canonical JSON
 */

import { cryptoHashAdapter } from '../../../adapters/crypto/hash/crypto-hash-adapter';
import { specHashContract } from '../../../contracts/spec-hash/spec-hash-contract';
import type { SpecHash } from '../../../contracts/spec-hash/spec-hash-contract';
import type { LaneSpec } from '../../../contracts/lane-spec/lane-spec-contract';
import { laneSpecCanonicalJsonTransformer } from '../../../transformers/lane-spec-canonical-json/lane-spec-canonical-json-transformer';

export const laneSpecHashBroker = ({ spec }: { spec: LaneSpec }): SpecHash => {
  const canonicalJson = laneSpecCanonicalJsonTransformer({ spec });
  const digest = cryptoHashAdapter({ content: canonicalJson });
  return specHashContract.parse(digest);
};
