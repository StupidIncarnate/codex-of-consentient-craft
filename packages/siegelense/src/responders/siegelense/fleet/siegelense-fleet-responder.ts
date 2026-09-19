/**
 * PURPOSE: The human surface `dungeonmaster siegelense` (bare) serves — every registry row as one
 * aligned line under a header, because a person at a terminal wanting to know what is running has no
 * MCP client and "open a REPL and call a broker" is not a verification step (siegelense-tooling.md
 * line 290). The evidence path is printed ONCE, as a shape beneath the table, never per row: every
 * row's real evidence path shares that prefix and differs only by the id already printed in column
 * one. A `killed` row is a TOMBSTONE nothing built removes — the footer explaining that prints only
 * once at least one row is `killed`, so a fleet with none reads exactly as before. Writes through
 * `process.stdout.write`, never `console.log`, matching every other CLI surface in this repo. An
 * EMPTY registry is a real answer, printed plainly, never an error.
 *
 * USAGE:
 * await SiegelenseFleetResponder();
 * // Writes the aligned table, the evidence shape, and — if any row is killed — the tombstone footer
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { fleetListingStatics } from '../../../statics/fleet-listing/fleet-listing-statics';
import { fleetTableRenderTransformer } from '../../../transformers/fleet-table-render/fleet-table-render-transformer';
import { killedFooterRenderTransformer } from '../../../transformers/killed-footer-render/killed-footer-render-transformer';

const EMPTY_MESSAGE = 'No siegelense instances running.\n';

export const SiegelenseFleetResponder = async (): Promise<AdapterResult> => {
  const registry = await registryReadBroker();

  if (registry.instances.length === 0) {
    process.stdout.write(EMPTY_MESSAGE);
    return adapterResultContract.parse({ success: true });
  }

  const nowMs = epochMsContract.parse(Date.now());
  process.stdout.write(fleetTableRenderTransformer({ entries: registry.instances, nowMs }));
  process.stdout.write(`\n${fleetListingStatics.evidence.shapeLine}`);

  const killedCount = registry.instances.filter((entry) => entry.state === 'killed').length;
  if (killedCount > 0) {
    process.stdout.write(`\n${killedFooterRenderTransformer({ killedCount })}`);
  }

  return adapterResultContract.parse({ success: true });
};
