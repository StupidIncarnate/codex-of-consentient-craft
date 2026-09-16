/**
 * PURPOSE: The human surface `dungeonmaster siegelense` (bare) serves — every registry row as one
 * line to stdout, because a person at a terminal wanting to know what is running has no MCP client
 * and "open a REPL and call a broker" is not a verification step (siegelense-tooling.md line 290).
 * Writes through `process.stdout.write`, never `console.log`, matching every other CLI surface in
 * this repo. An EMPTY registry is a real answer, printed plainly, never an error.
 *
 * USAGE:
 * await SiegelenseFleetResponder();
 * // Writes a header row plus one line per registry entry to stdout
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { locationsInstanceEvidencePathFindBroker } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../../brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryEntryRowFormatTransformer } from '../../../transformers/registry-entry-row-format/registry-entry-row-format-transformer';

const EMPTY_MESSAGE = 'No siegelense instances running.\n';
const HEADER_LINE = 'ID\tSTATE\tSPEC\tPORTS\tLAST BEAT\tEVIDENCE\n';

export const SiegelenseFleetResponder = async (): Promise<AdapterResult> => {
  const registry = await registryReadBroker();

  if (registry.instances.length === 0) {
    process.stdout.write(EMPTY_MESSAGE);
    return adapterResultContract.parse({ success: true });
  }

  const rows = await Promise.all(
    registry.instances.map(async (entry) => {
      const evidenceHome = locationsInstanceEvidencePathFindBroker({
        instanceId: entry.id,
        guildId: entry.guildId,
      });
      const evidence = await locationsRepoLinkPathFindBroker({ homePath: evidenceHome });
      return registryEntryRowFormatTransformer({ entry, evidence });
    }),
  );

  process.stdout.write(HEADER_LINE);
  rows.forEach((row) => {
    process.stdout.write(`${row}\n`);
  });

  return adapterResultContract.parse({ success: true });
};
