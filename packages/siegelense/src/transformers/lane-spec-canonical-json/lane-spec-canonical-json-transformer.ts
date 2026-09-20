/**
 * PURPOSE: Rebuilds a `LaneSpec` as JSON whose bytes depend only on the spec's CONTENT, never on
 * how a caller happened to construct it — every field is named explicitly in a fixed order (so two
 * specs built by spreading in different orders still serialize identically) and every `env` record's
 * keys are sorted before being written (so `{A,B}` and `{B,A}` produce the same string). This is
 * the input `lane-spec-hash-broker` hashes; a transformer cannot reach the `crypto` module itself
 * (contracts/statics/errors/guards/transformers only), so this file stops at the canonical STRING
 * and the broker's adapter turns it into a digest. `processes` keeps the caller's own array order —
 * unlike an `env` record's keys, which process a spec claims and in what order is part of what the
 * hash is supposed to notice changing.
 *
 * USAGE:
 * laneSpecCanonicalJsonTransformer({ spec: LaneSpecStub() });
 * // Returns a ContentText of canonical JSON, stable across two differently-ordered equivalent specs
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { LaneSpec } from '../../contracts/lane-spec/lane-spec-contract';

export const laneSpecCanonicalJsonTransformer = ({ spec }: { spec: LaneSpec }): ContentText =>
  contentTextContract.parse(
    JSON.stringify({
      name: spec.name,
      processes: spec.processes.map((process) => ({
        name: process.name,
        command: process.command,
        args: process.args,
        portRole: process.portRole,
        readyPath: process.readyPath,
        logFileName: process.logFileName,
        env: Object.fromEntries(
          Object.entries(process.env).sort(([keyA], [keyB]) =>
            keyA < keyB ? -1 : keyA > keyB ? 1 : 0,
          ),
        ),
      })),
      browser: spec.browser,
      bootTimeoutMs: spec.bootTimeoutMs,
      env: Object.fromEntries(
        Object.entries(spec.env).sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0)),
      ),
    }),
  );
