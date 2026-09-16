/**
 * PURPOSE: Renders every registry row as one aligned line under a header — `dungeonmaster
 * siegelense`'s bare-invocation table. Each column pads to the widest cell ACTUALLY being printed,
 * computed from the rows in THIS call, never a fixed width — a longer spec name widens its own
 * column instead of breaking alignment for every row above it. Reuses `elapsedRenderTransformer` for
 * LAST BEAT, the same function `status`'s own render path calls, so one instance's heartbeat age
 * reads identically in both places rather than drifting apart under two renderers of the same value.
 * Evidence is not a column here: every row's real evidence path shares one prefix and differs only by
 * the id already printed in column one, so the caller prints that shape once, beneath the table,
 * rather than repeating it on every row.
 *
 * USAGE:
 * fleetTableRenderTransformer({ entries: [RegistryEntryStub()], nowMs: EpochMsStub() });
 * // Returns the header line plus one padded line per entry, LAST BEAT rendered as an age
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { RegistryEntry } from '../../contracts/registry-entry/registry-entry-contract';
import { fleetListingStatics } from '../../statics/fleet-listing/fleet-listing-statics';
import { elapsedRenderTransformer } from '../elapsed-render/elapsed-render-transformer';

export const fleetTableRenderTransformer = ({
  entries,
  nowMs,
}: {
  entries: readonly RegistryEntry[];
  nowMs: EpochMs;
}): ContentText => {
  const { header, columnGap } = fleetListingStatics.table;
  const gap = ' '.repeat(columnGap);

  const rows = entries.map((entry) => [
    entry.id,
    entry.state,
    entry.specName,
    `${entry.ports.api}/${entry.ports.web}`,
    entry.lastBeatMs === null
      ? '-'
      : elapsedRenderTransformer({ elapsedMs: epochMsContract.parse(nowMs - entry.lastBeatMs) }),
  ]);

  const widths = header.map((label, columnIndex) =>
    Math.max(label.length, ...rows.map((row) => row[columnIndex]?.length ?? 0)),
  );

  const lines = [header, ...rows].map((cells) =>
    cells
      .map((cell, columnIndex) =>
        columnIndex === cells.length - 1 ? cell : cell.padEnd(widths[columnIndex] ?? cell.length),
      )
      .join(gap),
  );

  return contentTextContract.parse(lines.map((line) => `${line}\n`).join(''));
};
