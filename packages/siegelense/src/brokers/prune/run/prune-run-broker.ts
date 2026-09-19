/**
 * PURPOSE: The whole `prune` call — reclaim asset space deliberately rather than waiting for the
 * age-out window (siegelense-tooling.md line 2420). The three selectors COMBINE: `--kind video`
 * plus `--older-than 2d` is the spec's own worked call. It acts on ASSETS and touches no instance:
 * no process is signalled and no port released, and the only registry write is the TOMBSTONE a
 * fully-taken tree earns, so `results` answers `pruned at …, olderThan 7d` rather than an empty list
 * (line 331). `unresolved` carries every citation KIND the resolver could not check, deduplicated
 * across the sweep — without it a caller reading `refused: []` would take it for "nothing cites any
 * of this", which is the deletion this call exists to prevent. Reach for this over
 * `cleanupRunBroker`: that one reaps STALE INSTANCES and ages assets as a side effect, while this
 * one is asked for by a caller who wants the space back now.
 *
 * USAGE:
 * await pruneRunBroker({ query: PruneQueryStub({ olderThan: '7d' }) });
 * // Returns the PruneAnswer — freedMB/freedBytes, removed[], refused[], unresolved[]
 */

import type { CitationGap } from '../../../contracts/citation-gap/citation-gap-contract';
import type { CitationKind } from '../../../contracts/citation-kind/citation-kind-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { fileSizeBytesContract } from '../../../contracts/file-size-bytes/file-size-bytes-contract';
import { instanceStateContract } from '../../../contracts/instance-state/instance-state-contract';
import { megabytesContract } from '../../../contracts/megabytes/megabytes-contract';
import { pruneAnswerContract } from '../../../contracts/prune-answer/prune-answer-contract';
import type { PruneAnswer } from '../../../contracts/prune-answer/prune-answer-contract';
import type { PruneQuery } from '../../../contracts/prune-query/prune-query-contract';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { pruneStatics } from '../../../statics/prune/prune-statics';
import { pruneOlderThanParseTransformer } from '../../../transformers/prune-older-than-parse/prune-older-than-parse-transformer';
import { pruneTombstoneRuleRenderTransformer } from '../../../transformers/prune-tombstone-rule-render/prune-tombstone-rule-render-transformer';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';
import { pruneInstanceReclaimBroker } from '../instance-reclaim/prune-instance-reclaim-broker';

const PRUNED_STATE = instanceStateContract.parse('pruned');

export const pruneRunBroker = async ({ query }: { query: PruneQuery }): Promise<PruneAnswer> => {
  const nowMs = epochMsContract.parse(Date.now());
  const olderThanMs = pruneOlderThanParseTransformer({ olderThan: query.olderThan });
  const registry = await registryReadBroker();

  const candidates =
    query.instanceId === null
      ? registry.instances
      : registry.instances.filter((entry) => entry.id === query.instanceId);

  if (query.instanceId !== null && candidates.length === 0) {
    throw new InstanceUnknownError({ instanceId: String(query.instanceId) });
  }

  const outcomes = await Promise.all(
    candidates.map(async (entry) =>
      pruneInstanceReclaimBroker({ entry, query, olderThanMs, nowMs }),
    ),
  );

  const removed = outcomes.flatMap((outcome) =>
    outcome.removal === null ? [] : [outcome.removal],
  );
  const refused = outcomes.flatMap((outcome) =>
    outcome.refusal === null ? [] : [outcome.refusal],
  );

  // One row per KIND, however many instances reported the same gap — a sweep of forty rows that
  // could not check for issue records has one unchecked question, not forty.
  const gapsByKind = new Map<CitationKind, CitationGap>();
  for (const outcome of outcomes) {
    for (const gap of outcome.gaps) {
      gapsByKind.set(gap.kind, gap);
    }
  }

  const tombstonedIds = new Set(
    removed.filter((removal) => removal.tombstoned).map((removal) => String(removal.id)),
  );

  if (tombstonedIds.size > 0) {
    const prunedByRule = pruneTombstoneRuleRenderTransformer({ query });

    await registryUpdateBroker({
      mutate: (current) => ({
        instances: current.instances.map((entry) =>
          tombstonedIds.has(String(entry.id))
            ? {
                ...entry,
                state: PRUNED_STATE,
                prunedAtMs: nowMs,
                prunedByRule,
                socketPath: null,
              }
            : entry,
        ),
      }),
    });
  }

  const freedBytes = removed.reduce((total, removal) => total + Number(removal.freedBytes), 0);

  return pruneAnswerContract.parse({
    freedMB: megabytesContract.parse(Math.floor(freedBytes / pruneStatics.size.bytesPerMegabyte)),
    freedBytes: fileSizeBytesContract.parse(freedBytes),
    removed,
    refused,
    unresolved: [...gapsByKind.values()],
  });
};
