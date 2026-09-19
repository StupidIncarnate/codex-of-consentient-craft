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
  const { header, cellPadding } = fleetListingStatics.table;

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

  const topLine = `┌${widths.map((w) => '─'.repeat(w + cellPadding)).join('┬')}┐`;
  const headerLine = `│${header.map((h, i) => ` ${h.padEnd(widths[i] ?? h.length)} `).join('│')}│`;
  const headerSeparator = `├${widths.map((w) => '─'.repeat(w + cellPadding)).join('┼')}┤`;
  const rowLines = rows.map(
    (cells) => `│${cells.map((c, i) => ` ${c.padEnd(widths[i] ?? c.length)} `).join('│')}│`,
  );
  const bottomLine = `└${widths.map((w) => '─'.repeat(w + cellPadding)).join('┴')}┘`;

  const lines = [topLine, headerLine, headerSeparator, ...rowLines, bottomLine];

  return contentTextContract.parse(`${lines.join('\n')}\n`);
};
