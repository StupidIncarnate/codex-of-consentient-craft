/**
 * PURPOSE: Renders a `StatusAnswer` into the text a person reads at a terminal — the fleet form
 * (monitored vocabulary, machine reading, one line per instance) whenever no single instance
 * carries evidence, and the full single-instance form (last beat, last step, MEMORY, orphans,
 * the evidence directory and its file tree, likelyCause) when the one instance present does. The
 * MACHINE line says `OOM kills unreadable` when the kernel counter could not be read, so it never
 * reads like a count of zero. MEMORY is the last measured
 * memory of the instance's processes — for a killed instance, its footprint when it ended — labelled
 * plainly rather than as "RSS". Evidence is non-null only for a NAMED
 * query — `statusReadBroker`'s own no-browsing rule leaves it `null` on every fleet row — so that
 * field is what tells the two forms apart without a separate flag. Zero instances is AMBIGUOUS on
 * its own — `statusReadBroker` answers `instances: []` both for a genuinely empty fleet and for a
 * named id the registry never held — so this transformer takes the `instanceId` the caller asked
 * for and renders the two apart: a fleet query gets a sentence naming the `branch`/`since` filters
 * that left it empty, a named query that resolved nothing gets a sentence naming the id as unknown.
 * Without that parameter, a typo'd `--instance` would read exactly like an empty fleet, which is the
 * whole reason this file exists. `branch`/`since` are the SAME filters `statusReadBroker` applied —
 * passed straight through from the responder — because a `status` fleet listing filters by age and
 * branch, never by alive, so "no instances running" was never an accurate reason for an empty table.
 * `MONITORED`/`MACHINE` still print on an empty fleet: the host reading is useful independent of
 * whether any instance matched. Pure, so this text is provable without stdout. `SiegelenseFlow`
 * routes a bare `dungeonmaster siegelense` (no subcommand) to the same `SiegelenseStatusResponder`
 * call `status` with no flags reaches, so this is the ONLY fleet-table renderer in the package.
 *
 * ORPHANS renders ONE ROW PER ITEM, with a blank FIELD on every continuation row, never a
 * comma-joined list on one row — that join is what pushed a real terminal table to roughly 500
 * characters wide when an instance carried several evidence paths. EVIDENCE DIR is one absolute
 * path, followed by one continuation row per line of `evidenceTreeRenderTransformer`'s file tree —
 * every file in the directory, relative to that path — or a single `no files` row.
 *
 * USAGE:
 * statusAnswerRenderTransformer({
 *   answer: StatusAnswerStub({ instances: [] }),
 *   instanceId: null,
 *   branch: null,
 *   since: '6h',
 * });
 * // Returns 'MONITORED: ...\nMACHINE: ...\nNo siegelense instances created in the last 6hr. Widen with --since beginning.\n'
 *
 * statusAnswerRenderTransformer({ answer: StatusAnswerStub({ instances: [] }), instanceId: InstanceIdStub() });
 * // Returns 'No record of the instance id "<id>". Check the id that `dungeonmaster siegelense start` returned.\n'
 */

import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

import { InstanceUnknownError } from '../../errors/instance-unknown/instance-unknown-error';
import type { StatusAnswer } from '../../contracts/status-answer/status-answer-contract';
import { statusTableStatics } from '../../statics/status-table/status-table-statics';
import { evidenceTreeRenderTransformer } from '../evidence-tree-render/evidence-tree-render-transformer';

export const statusAnswerRenderTransformer = ({
  answer,
  instanceId,
  branch = null,
  since = null,
}: {
  answer: StatusAnswer;
  instanceId: SiegeInstance['id'] | null;
  branch?: string | null;
  since?: '1h' | '6h' | '1d' | 'beginning' | null;
}): string => {
  const monitoredLine = `MONITORED: ${answer.monitored.join(', ')}`;
  const machineLine = `MACHINE: free ${answer.machine.freeMemMB}MB/${answer.machine.totalMemMB}MB mem, free disk ${answer.machine.freeDiskMB ?? '-'}MB, ${answer.machine.cores} cores, load ${answer.machine.loadAvg.join('/')}, OOM kills ${answer.machine.oomKillsSinceBoot ?? 'unreadable'}`;

  if (answer.instances.length === 0) {
    if (instanceId !== null) {
      return `${new InstanceUnknownError({ instanceId }).message}\n`;
    }

    const { widest, display: sinceDisplay } = statusTableStatics.sinceWindows;

    const branchClause = branch === null ? '' : ` on branch "${branch}"`;
    const sinceClause =
      since === null || since === 'beginning' ? '' : ` in the last ${sinceDisplay[since]}`;
    const widenClause =
      since === widest
        ? branch === null
          ? ''
          : ' Widen by dropping --branch.'
        : ` Widen with --since ${sinceDisplay[widest]}.`;

    return `${monitoredLine}\n${machineLine}\nNo siegelense instances created${branchClause}${sinceClause}.${widenClause}\n`;
  }

  const [onlyInstance] = answer.instances;
  const namedEvidence = onlyInstance?.evidence ?? null;

  if (answer.instances.length === 1 && onlyInstance !== undefined && namedEvidence !== null) {
    const evidence = namedEvidence;
    // One row per orphan and per evidence-tree line, with a blank FIELD on every continuation row —
    // never a comma-joined list on one row. That join is what pushed a real terminal table to
    // roughly 500 characters wide: several paths sharing one row make the WHOLE table as wide as
    // their sum.
    const orphanRows =
      onlyInstance.orphans.length === 0
        ? [['ORPHANS', 'none']]
        : onlyInstance.orphans.map((orphan, index) => [
            index === 0 ? 'ORPHANS' : '',
            `pgid ${orphan.pgid} (${orphan.alive ? 'alive' : 'dead'})`,
          ]);
    const treeLines = evidenceTreeRenderTransformer({ listing: evidence });
    const evidenceTreeRows =
      treeLines.length === 0 ? [['', 'no files']] : treeLines.map((line) => ['', line]);
    const lastStepText =
      onlyInstance.lastStep === null
        ? '-'
        : `${onlyInstance.lastStep.run} step ${onlyInstance.lastStep.step} ${onlyInstance.lastStep.verb}`;
    const rssText =
      onlyInstance.memory === null
        ? '-'
        : onlyInstance.memory.measured === 'live'
          ? `${onlyInstance.memory.megabytes}MB`
          : `at last beat ${onlyInstance.memory.megabytes}MB`;

    const { headers: singleHeaders, cellPadding: singleCellPadding } =
      statusTableStatics.singleInstanceTable;

    const singleRows = [
      ['INSTANCE', `${onlyInstance.id} — ${onlyInstance.state}`],
      ['SPEC', onlyInstance.specName],
      ['UPTIME', onlyInstance.uptime ?? '-'],
      ['LAST BEAT', onlyInstance.lastBeat ?? '-'],
      ['RUNS', String(onlyInstance.runs)],
      ['MEMORY', rssText],
      ['LAST STEP', lastStepText],
      ...orphanRows,
      ['EVIDENCE DIR', evidence.dir.path],
      ...evidenceTreeRows,
      ['LIKELY CAUSE', onlyInstance.likelyCause ?? '-'],
    ];

    const singleWidths = singleHeaders.map((header, columnIndex) =>
      Math.max(header.length, ...singleRows.map((row) => row[columnIndex]?.length ?? 0)),
    );

    const singleTopLine = `┌${singleWidths.map((w) => '─'.repeat(w + singleCellPadding)).join('┬')}┐`;
    const singleHeaderLine = `│${singleHeaders.map((h, i) => ` ${h.padEnd(singleWidths[i] ?? h.length)} `).join('│')}│`;
    const singleHeaderSeparator = `├${singleWidths.map((w) => '─'.repeat(w + singleCellPadding)).join('┼')}┤`;
    const singleRowLines = singleRows.map(
      (cells) => `│${cells.map((c, i) => ` ${c.padEnd(singleWidths[i] ?? c.length)} `).join('│')}│`,
    );
    const singleBottomLine = `└${singleWidths.map((w) => '─'.repeat(w + singleCellPadding)).join('┴')}┘`;

    const singleTableLines = [
      singleTopLine,
      singleHeaderLine,
      singleHeaderSeparator,
      ...singleRowLines,
      singleBottomLine,
    ];

    return `${singleTableLines.join('\n')}\n`;
  }

  const { headers, cellPadding } = statusTableStatics.table;

  const rows = answer.instances.map((instance) => {
    const rss = instance.memory === null ? '-' : `${instance.memory.megabytes}MB`;
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

  return `${monitoredLine}\n${machineLine}\n${tableLines.join('\n')}\n`;
};
