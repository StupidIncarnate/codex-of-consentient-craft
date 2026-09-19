/**
 * PURPOSE: Renders a `SpecProfile` into a concise, token-efficient human summary
 * for terminal display — spec name, process count, content hash, measurement date/boot/runs,
 * and an aligned Unicode box-drawing table of samples by pool size (or 'none measured yet').
 *
 * USAGE:
 * profileAnswerRenderTransformer({ profile: SpecProfileStub() });
 * // Returns 'SPEC: dungeonmaster-stack\nPROCESSES: 3\n...'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { SpecProfile } from '../../contracts/spec-profile/spec-profile-contract';
import { profileStatics } from '../../statics/profile/profile-statics';

export const profileAnswerRenderTransformer = ({
  profile,
}: {
  profile: SpecProfile;
}): ContentText => {
  const bootText = profile.bootMs ? `${profile.bootMs}ms` : '-';
  const measuredLine = `MEASURED: ${profile.measuredAt ?? 'never'} (boot: ${bootText}, runs: ${profile.fromRuns})`;

  const headerLines = [
    `SPEC: ${profile.specName}`,
    `PROCESSES: ${profile.processes}`,
    `HASH: ${profile.hash}`,
    measuredLine,
  ];

  if (profile.samples.length === 0) {
    return contentTextContract.parse([...headerLines, 'SAMPLES: none measured yet', ''].join('\n'));
  }

  const { headers, cellPadding } = profileStatics.table;

  const rows = profile.samples.map((sample) => [
    String(sample.poolSize),
    `${sample.steadyMB}MB`,
    `${sample.peakMB}MB`,
    String(sample.runs),
  ]);

  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );

  const topLine = `┌${widths.map((w) => '─'.repeat(w + cellPadding)).join('┬')}┐`;
  const headerLine = `│${headers.map((h, i) => ` ${h.padEnd(widths[i] ?? h.length)} `).join('│')}│`;
  const headerSeparator = `├${widths.map((w) => '─'.repeat(w + cellPadding)).join('┼')}┤`;
  const rowLines = rows.map(
    (cells) => `│${cells.map((c, i) => ` ${c.padEnd(widths[i] ?? c.length)} `).join('│')}│`,
  );
  const bottomLine = `└${widths.map((w) => '─'.repeat(w + cellPadding)).join('┴')}┘`;

  const tableLines = [topLine, headerLine, headerSeparator, ...rowLines, bottomLine];

  return contentTextContract.parse([...headerLines, ...tableLines, ''].join('\n'));
};
