/**
 * PURPOSE: Mints an instance id, resolves the owner from `process.pid` (the MCP stdio child is
 * one-per-parent-session, so its own pid identifies "this session" exactly — see
 * `packages/mcp/CLAUDE.md`), claims a free port pair, and writes a RESERVATION row —
 * `pid: null`, `bootedAtMs: null` — before anything boots. Reserving ahead of booting is the cure
 * for two failure classes: the OS can hand two sessions the same free pair in the same moment
 * (spec line 183), and `capacity` has to count a reservation as taken or three sessions each
 * dividing free memory by peak all conclude they can start two, and six boot (spec line 185).
 *
 * Every candidate pair — up to `instanceLifecycleStatics.ports.claimAttempts` of them — is asked
 * of the OS UPFRONT (the calls do not depend on each other), then checked against ONE registry
 * snapshot inside a SINGLE `registryUpdateBroker` read-mutate-write: picking the first candidate
 * that collides with nothing already claimed, or throwing `PortClaimExhaustedError` when none do.
 * One atomic call rather than a read-modify-write per re-roll keeps the retry loop from opening a
 * fresh window on every attempt for another session's write to land in.
 *
 * USAGE:
 * await instanceReserveBroker({ specName, specHash, questId, guildId });
 * // Returns the written RegistryEntry — a reservation, evidence directory already minted
 */

import { fsMkdirAdapter, netFreePortPairAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../../../contracts/instance-id/instance-id-contract';
import { instanceOwnerContract } from '../../../contracts/instance-owner/instance-owner-contract';
import { portPairContract } from '../../../contracts/port-pair/port-pair-contract';
import type { PortPair } from '../../../contracts/port-pair/port-pair-contract';
import { registryEntryContract } from '../../../contracts/registry-entry/registry-entry-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import type { SpecHash } from '../../../contracts/spec-hash/spec-hash-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { PortClaimExhaustedError } from '../../../errors/port-claim-exhausted/port-claim-exhausted-error';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';

export const instanceReserveBroker = async ({
  specName,
  specHash,
  questId,
  guildId,
}: {
  specName: SpecName;
  specHash: SpecHash;
  questId: QuestId | null;
  guildId: GuildId | null;
}): Promise<RegistryEntry> => {
  // crypto.randomUUID() dashes stripped — the whole hex payload, comfortably above
  // instanceIdContract's 4-char minimum, with no length arithmetic to hold a magic number.
  // split/join, not a regex: regex literals are confined to contracts/guards/transformers.
  const entropyHex = crypto.randomUUID().split('-').join('');
  const resolvedInstanceId = instanceIdContract.parse(
    `${instanceLifecycleStatics.ids.instancePrefix}${entropyHex}`,
  );
  const resolvedOwner = instanceOwnerContract.parse(String(process.pid));
  const resolvedReservedAtMs = epochMsContract.parse(Date.now());

  const rawPairs = await Promise.all(
    Array.from({ length: instanceLifecycleStatics.ports.claimAttempts }, async () =>
      netFreePortPairAdapter(),
    ),
  );
  const candidatePairs: PortPair[] = rawPairs.map(({ firstPort, secondPort }) =>
    portPairContract.parse({ api: firstPort, web: secondPort }),
  );

  const updatedRegistry = await registryUpdateBroker({
    mutate: (registry) => {
      const winner = candidatePairs.find(
        (candidate) =>
          !registry.instances.some(
            (existing) =>
              existing.ports.api === candidate.api ||
              existing.ports.api === candidate.web ||
              existing.ports.web === candidate.api ||
              existing.ports.web === candidate.web,
          ),
      );

      if (winner === undefined) {
        throw new PortClaimExhaustedError({ attempts: candidatePairs.length });
      }

      const entry = registryEntryContract.parse({
        id: resolvedInstanceId,
        owner: resolvedOwner,
        questId,
        guildId,
        specName,
        specHash,
        pid: null,
        pgids: [],
        ports: winner,
        state: 'alive',
        reservedAtMs: resolvedReservedAtMs,
        bootedAtMs: null,
        lastBeatMs: null,
        prunedAtMs: null,
        prunedByRule: null,
      });

      return { instances: [...registry.instances, entry] };
    },
  });

  const writtenEntry = updatedRegistry.instances.find((entry) => entry.id === resolvedInstanceId);

  if (writtenEntry === undefined) {
    throw new Error(
      `instanceReserveBroker: ${resolvedInstanceId} not found in the updated registry`,
    );
  }

  const evidencePath = locationsInstanceEvidencePathFindBroker({
    instanceId: resolvedInstanceId,
    guildId,
  });
  await fsMkdirAdapter({ filepath: filePathContract.parse(evidencePath) });

  return writtenEntry;
};
