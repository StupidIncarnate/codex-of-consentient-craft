/**
 * PURPOSE: Renders a `StatusAnswer` into the text a person reads at a terminal — the fleet form
 * (monitored vocabulary, machine reading, one line per instance) whenever no single instance
 * carries evidence, and the full single-instance form (last beat, last step, RSS, orphans, evidence
 * paths, likelyCause) when the one instance present does. Evidence is non-null only for a NAMED
 * query — `statusReadBroker`'s own no-browsing rule leaves it `null` on every fleet row — so that
 * field is what tells the two forms apart without a separate flag. Zero instances is AMBIGUOUS on
 * its own — `statusReadBroker` answers `instances: []` both for a genuinely empty fleet and for a
 * named id the registry never held — so this transformer takes the `instanceId` the caller asked
 * for and renders the two apart: a fleet query gets the plain empty-fleet sentence, a named query
 * that resolved nothing gets a sentence naming the id as unknown. Without that parameter, a typo'd
 * `--instance` would read exactly like an empty fleet, which is the whole reason this file exists.
 * Pure, so this text is provable without stdout, the same split `fleetTableRenderTransformer`
 * already uses for the bare fleet listing.
 *
 * USAGE:
 * statusAnswerRenderTransformer({ answer: StatusAnswerStub({ instances: [] }), instanceId: null });
 * // Returns 'No siegelense instances running.\n'
 *
 * statusAnswerRenderTransformer({ answer: StatusAnswerStub({ instances: [] }), instanceId: InstanceIdStub() });
 * // Returns 'No instance by the id "<id>" — unknown, never existed.\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { InstanceId } from '../../contracts/instance-id/instance-id-contract';
import type { StatusAnswer } from '../../contracts/status-answer/status-answer-contract';
import { statusTableStatics } from '../../statics/status-table/status-table-statics';

const EMPTY_MESSAGE = 'No siegelense instances running.\n';

export const statusAnswerRenderTransformer = ({
  answer,
  instanceId,
}: {
  answer: StatusAnswer;
  instanceId: InstanceId | null;
}): ContentText => {
  if (answer.instances.length === 0) {
    return contentTextContract.parse(
      instanceId === null
        ? EMPTY_MESSAGE
        : `No instance by the id "${instanceId}" — unknown, never existed.\n`,
    );
  }

  const [onlyInstance] = answer.instances;
  const namedEvidence = onlyInstance?.evidence ?? null;

  if (answer.instances.length === 1 && onlyInstance !== undefined && namedEvidence !== null) {
    const evidence = namedEvidence;
    const orphansText =
      onlyInstance.orphans.length === 0
        ? 'none'
        : onlyInstance.orphans
            .map((orphan) => `pgid ${orphan.pgid} (${orphan.alive ? 'alive' : 'dead'})`)
            .join(', ');
    const lastStepText =
      onlyInstance.lastStep === null
        ? '-'
        : `${onlyInstance.lastStep.run} step ${onlyInstance.lastStep.step} ${onlyInstance.lastStep.verb}`;
    const rssText =
      onlyInstance.rssMB === null
        ? onlyInstance.rssAtLastBeat === null
          ? '-'
          : `at last beat ${onlyInstance.rssAtLastBeat}MB`
        : `${onlyInstance.rssMB}MB`;

    return contentTextContract.parse(
      [
        `INSTANCE ${onlyInstance.id} — ${onlyInstance.state}`,
        `SPEC: ${onlyInstance.specName}`,
        `UPTIME: ${onlyInstance.uptime ?? '-'}`,
        `LAST BEAT: ${onlyInstance.lastBeat ?? '-'}`,
        `RUNS: ${onlyInstance.runs}`,
        `RSS: ${rssText}`,
        `LAST STEP: ${lastStepText}`,
        `ORPHANS: ${orphansText}`,
        `EVIDENCE DIR: ${evidence.dir.path}`,
        `TRANSCRIPT: ${evidence.transcript ?? '-'}`,
        `LOGS: ${evidence.logs.length === 0 ? 'none' : evidence.logs.join(', ')}`,
        `LAST SHOT: ${evidence.lastShot ?? '-'}`,
        `LIKELY CAUSE: ${onlyInstance.likelyCause ?? '-'}`,
        '',
      ].join('\n'),
    );
  }

  const monitoredLine = `MONITORED: ${answer.monitored.join(', ')}`;
  const machineLine = `MACHINE: free ${answer.machine.freeMemMB}MB/${answer.machine.totalMemMB}MB mem, free disk ${answer.machine.freeDiskMB ?? '-'}MB, ${answer.machine.cores} cores, load ${answer.machine.loadAvg.join('/')}, OOM kills ${answer.machine.oomKillsSinceBoot ?? '-'} (last ${answer.machine.lastOomAt ?? '-'})`;

  const { headers, cellPadding } = statusTableStatics.table;

  const rows = answer.instances.map((instance) => {
    const rss =
      instance.rssMB === null
        ? instance.rssAtLastBeat === null
          ? '-'
          : `${instance.rssAtLastBeat}MB`
        : `${instance.rssMB}MB`;
    return [
      instance.id,
      instance.state,
      instance.specName,
      instance.branch ?? '-',
      instance.uptime ?? '-',
      instance.lastBeat ?? '-',
      String(instance.runs),
      rss,
      String(instance.orphans.length),
    ];
  });

  const widths = headers.map((header, columnIndex) =>
    Math.max(header.length, ...rows.map((row) => row[columnIndex]?.length ?? 0)),
  );

  const topLine = `┌${widths.map((w) => '─'.repeat(w + cellPadding)).join('┬')}┐`;
  const headerLine = `│${headers.map((h, i) => ` ${h.padEnd(widths[i] ?? h.length)} `).join('│')}│`;
  const headerSeparator = `├${widths.map((w) => '─'.repeat(w + cellPadding)).join('┼')}┤`;
  const rowLines = rows.map(
    (cells) => `│${cells.map((c, i) => ` ${c.padEnd(widths[i] ?? c.length)} `).join('│')}│`,
  );
  const bottomLine = `└${widths.map((w) => '─'.repeat(w + cellPadding)).join('┴')}┘`;

  const tableLines = [topLine, headerLine, headerSeparator, ...rowLines, bottomLine];

  return contentTextContract.parse(`${monitoredLine}\n${machineLine}\n${tableLines.join('\n')}\n`);
};
