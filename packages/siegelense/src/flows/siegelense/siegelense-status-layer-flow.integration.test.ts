/**
 * PURPOSE: Drives `SiegelenseStatusLayerFlow` through its real argv surface — `--instance`,
 * `--branch`, `--since` (`1hr`/`1h`, `6hr`/`6h`, `1day`/`1d`, `beginning`) and `--json` — against a
 * real `registry.json` under a fresh `installTestbedCreateBroker` tree, matching how the `status`
 * cases in `siegelense-flow.integration.test.ts` drive a real evidence tree with no mocks. Neither
 * `--branch` nor `--since` had ever been driven as literal argv before this file — both had real
 * broker-level coverage (`status-read-broker.test.ts`), but nothing spanned the
 * parser-to-responder-to-broker seam those flags cross. Every fabricated instance is `state: 'killed'`
 * with `pgids: []` and no evidence directory on disk: `instanceStateResolveBroker` answers `'killed'`
 * straight off the registry row without touching the heartbeat/reservation staleness checks a live row
 * would need, and every other per-row read (`heartbeatReadBroker`, `fsReaddirAdapter`,
 * `orphanReadBroker`, `shutdownReasonReadBroker`) already answers a documented empty/null default for
 * a missing file rather than throwing — so the fixture stays REAL disk I/O through the whole chain
 * while every column except `LAST BEAT` renders a fixed literal. `LAST BEAT` stays deterministic too:
 * each `lastBeatMs` is set tens of minutes or hours before the call, far from the
 * `elapsedRenderTransformer` minute/hour rounding boundaries a few milliseconds of test runtime could
 * cross. The one true live read is `machine.oomKillsSinceBoot` (feeds `likelyCause`), which never
 * appears in the fleet TABLE render at all (no `likelyCause` column) — the reason every multi-instance
 * `--branch`/`--since` case below renders the human table rather than `--json`. The two `--json`
 * assertions that remain stay exact-literal only because their `instances` array is empty (a
 * `--branch` matching nothing, an unknown `--instance`), the same `machine`-block-stripped technique
 * `siegelense-flow.integration.test.ts` already applies to `status --json`. The one place a live value
 * survives into an assertion — the known-instance human render's `LIKELY CAUSE` line — is normalised by
 * its own regex before the `toBe`, same idea, applied to that one line instead of a JSON block.
 *
 * USAGE:
 * await SiegelenseStatusLayerFlow({ callArgs: ['--branch', 'main', '--since', 'beginning'] });
 * // Writes the rendered table for every main-branch instance, regardless of age
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../contracts/registry/registry.stub';
import { SpecNameStub } from '../../contracts/spec-name/spec-name.stub';
import { machineStatics } from '../../statics/machine/machine-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';

import { SiegelenseStatusLayerFlow } from './siegelense-status-layer-flow';

// 20 minutes ago, 90 minutes ago and 7 hours ago — inside 1h/6h/1d, inside only 6h/1d, and inside
// only 1d/beginning, respectively. Every offset sits far enough from a minute/hour rounding edge
// that the whole suite's runtime cannot cross it.
const MAIN_RECENT_ID = InstanceIdStub({ value: 'inst_00001aaa' });
const FEATURE_MID_ID = InstanceIdStub({ value: 'inst_00002bbb' });
const MAIN_OLD_ID = InstanceIdStub({ value: 'inst_00003ccc' });
const UNKNOWN_INSTANCE_ID = InstanceIdStub({ value: 'inst_deadbeef01' });
const SPEC_NAME = SpecNameStub({ value: 'dungeonmaster-stack' });

const MACHINE_BLOCK_PATTERN = / {2}"machine": \{[\s\S]*?\n {2}\},\n/u;
const LIKELY_CAUSE_PATTERN =
  /^LIKELY CAUSE: rss unavailable at last beat; kernel OOM (?:kills since boot: \d+|events unavailable)$/mu;

const EMPTY_BRANCH_STATUS_JSON = `${JSON.stringify(
  { monitored: machineStatics.monitored, instances: [], queriedInstanceState: null },
  null,
  siegelenseOutputStatics.json.indentSpaces,
)}\n`;

const UNKNOWN_NAMED_STATUS_JSON = `${JSON.stringify(
  { monitored: machineStatics.monitored, instances: [], queriedInstanceState: 'unknown' },
  null,
  siegelenseOutputStatics.json.indentSpaces,
)}\n`;

// Every table below shares identical column widths (13/6/19/6/6/9/4/3/7): the ID, STATE, SPEC and
// BRANCH values are the same length across every fixture row, and every other column's widest cell
// is its own header. The trailing '' matches the split artifact of the render's own trailing '\n'.
const TABLE_TOP =
  '┌───────────────┬────────┬─────────────────────┬────────┬────────┬───────────┬──────┬─────┬─────────┐';
const TABLE_HEADER =
  '│ ID            │ STATE  │ SPEC                │ BRANCH │ UPTIME │ LAST BEAT │ RUNS │ RSS │ ORPHANS │';
const TABLE_SEPARATOR =
  '├───────────────┼────────┼─────────────────────┼────────┼────────┼───────────┼──────┼─────┼─────────┤';
const TABLE_BOTTOM =
  '└───────────────┴────────┴─────────────────────┴────────┴────────┴───────────┴──────┴─────┴─────────┘';
const MAIN_RECENT_ROW =
  '│ inst_00001aaa │ killed │ dungeonmaster-stack │ main   │ -      │ 20m       │ 0    │ -   │ 0       │';
const FEATURE_MID_ROW =
  '│ inst_00002bbb │ killed │ dungeonmaster-stack │ beta   │ -      │ 1h        │ 0    │ -   │ 0       │';
const MAIN_OLD_ROW =
  '│ inst_00003ccc │ killed │ dungeonmaster-stack │ main   │ -      │ 7h        │ 0    │ -   │ 0       │';

const SINCE_1H_TABLE_LINES = [
  TABLE_TOP,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  MAIN_RECENT_ROW,
  TABLE_BOTTOM,
  '',
];
const SINCE_6H_TABLE_LINES = [
  TABLE_TOP,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  MAIN_RECENT_ROW,
  FEATURE_MID_ROW,
  TABLE_BOTTOM,
  '',
];
const SINCE_1D_TABLE_LINES = [
  TABLE_TOP,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  MAIN_RECENT_ROW,
  FEATURE_MID_ROW,
  MAIN_OLD_ROW,
  TABLE_BOTTOM,
  '',
];
const BRANCH_MAIN_TABLE_LINES = [
  TABLE_TOP,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  MAIN_RECENT_ROW,
  MAIN_OLD_ROW,
  TABLE_BOTTOM,
  '',
];
const BRANCH_BETA_TABLE_LINES = [
  TABLE_TOP,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  FEATURE_MID_ROW,
  TABLE_BOTTOM,
  '',
];

// The parser's own accepted `--since` tokens (`status-args-parse-transformer.ts`) — both spellings
// of each window, plus `beginning` — each mapped to the table its own window must produce against
// the fixture above. '6h'/'6hr' share the same expected table as the no-flag default below: that
// default IS '6h', proven twice.
const SINCE_ALIAS_CASES = [
  ['1h', SINCE_1H_TABLE_LINES],
  ['1hr', SINCE_1H_TABLE_LINES],
  ['6h', SINCE_6H_TABLE_LINES],
  ['6hr', SINCE_6H_TABLE_LINES],
  ['1d', SINCE_1D_TABLE_LINES],
  ['1day', SINCE_1D_TABLE_LINES],
  ['beginning', SINCE_1D_TABLE_LINES],
] as const;

describe('SiegelenseStatusLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-status-layer-flow' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  beforeAll(() => {
    // machineReadBroker statfs's the dungeonmaster home directly, and `dungeonmaster init` mkdir
    // -p's `siegelense/` at install time — recreate that precondition, matching
    // siegelense-capacity-layer-flow.integration.test.ts's own beforeAll.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'siegelense/.keep' }),
      content: FileContentStub({ value: '' }),
    });

    const registry = RegistryStub({
      instances: [
        RegistryEntryStub({
          id: MAIN_RECENT_ID,
          branch: 'main',
          specName: SPEC_NAME,
          state: 'killed',
          lastBeatMs: Date.now() - 1_200_000,
        }),
        RegistryEntryStub({
          id: FEATURE_MID_ID,
          branch: 'beta',
          specName: SPEC_NAME,
          state: 'killed',
          lastBeatMs: Date.now() - 5_400_000,
        }),
        RegistryEntryStub({
          id: MAIN_OLD_ID,
          branch: 'main',
          specName: SPEC_NAME,
          state: 'killed',
          lastBeatMs: Date.now() - 25_200_000,
        }),
      ],
    });

    testbed.writeFile({
      relativePath: RelativePathStub({
        value: `${locationsStatics.siegelense.dir}/${locationsStatics.siegelense.registry}`,
      }),
      content: FileContentStub({ value: `${JSON.stringify(registry)}\n` }),
    });
  });

  afterAll(() => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });

  describe('the default --since window, no flag given', () => {
    it('VALID: {callArgs: []} => the 6hr default excludes the instance last seen 7h ago and keeps the two seen more recently', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: [] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput!.split('\n').slice(2)).toStrictEqual(SINCE_6H_TABLE_LINES);
    });
  });

  describe('every --since alias the parser accepts', () => {
    it.each(SINCE_ALIAS_CASES)(
      'VALID: {callArgs: [--since, %s]} => renders exactly the instances whose last beat falls inside that window',
      async (since, expectedLines) => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseStatusLayerFlow({ callArgs: ['--since', since] });

        process.stdout.write = originalWrite;

        const [wholeOutput] = writes;

        expect(wholeOutput!.split('\n').slice(2)).toStrictEqual(expectedLines);
      },
    );
  });

  describe('the --branch filter', () => {
    it('VALID: {callArgs: [--branch, main, --since, beginning]} => includes only the two main-branch instances, regardless of age', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--branch', 'main', '--since', 'beginning'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput!.split('\n').slice(2)).toStrictEqual(BRANCH_MAIN_TABLE_LINES);
    });

    it('VALID: {callArgs: [--branch, beta, --since, beginning]} => includes only the beta-branch instance', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--branch', 'beta', '--since', 'beginning'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput!.split('\n').slice(2)).toStrictEqual(BRANCH_BETA_TABLE_LINES);
    });
  });

  describe('the --branch filter matching no instance', () => {
    it('EMPTY: {callArgs: [--branch, nonexistent-branch]} => renders the empty-fleet message, not a table', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--branch', 'nonexistent-branch'] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual(['No siegelense instances running.\n']);
    });

    it('EMPTY: {callArgs: [--branch, nonexistent-branch, --json]} => writes the empty StatusAnswer as one JSON document', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--branch', 'nonexistent-branch', '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const withoutLiveMachineBlock = wholeOutput!.replace(MACHINE_BLOCK_PATTERN, '');

      expect(withoutLiveMachineBlock).toBe(EMPTY_BRANCH_STATUS_JSON);
    });
  });

  describe('the --instance flag naming a known instance', () => {
    it('VALID: {callArgs: [--instance, <known id>]} => renders that one instance in full instead of the fleet', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--instance', MAIN_RECENT_ID] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const normalized = wholeOutput!.replace(
        LIKELY_CAUSE_PATTERN,
        'LIKELY CAUSE: <host-dependent OOM reading, normalised>',
      );

      expect(normalized).toBe(
        `INSTANCE ${MAIN_RECENT_ID} — killed\n` +
          'SPEC: dungeonmaster-stack\n' +
          'UPTIME: -\n' +
          'LAST BEAT: 20m\n' +
          'RUNS: 0\n' +
          'RSS: -\n' +
          'LAST STEP: -\n' +
          'ORPHANS: none\n' +
          `EVIDENCE DIR: ${testbed.guildPath}/siegelense/unowned/instances/${MAIN_RECENT_ID}\n` +
          'TRANSCRIPT: -\n' +
          'LOGS: none\n' +
          'LAST SHOT: -\n' +
          'LIKELY CAUSE: <host-dependent OOM reading, normalised>\n',
      );
    });
  });

  describe('the --instance flag naming an id the registry never held', () => {
    it('VALID: {callArgs: [--instance, <unknown id>]} => names the id as unknown, never existed', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--instance', UNKNOWN_INSTANCE_ID] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        `No instance by the id "${UNKNOWN_INSTANCE_ID}" — unknown, never existed.\n`,
      ]);
    });

    it('VALID: {callArgs: [--instance, <unknown id>, --json]} => the JSON names it "unknown", distinct from an empty fleet', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseStatusLayerFlow({ callArgs: ['--instance', UNKNOWN_INSTANCE_ID, '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const withoutLiveMachineBlock = wholeOutput!.replace(MACHINE_BLOCK_PATTERN, '');

      expect(withoutLiveMachineBlock).toBe(UNKNOWN_NAMED_STATUS_JSON);
    });
  });

  describe('the refusal when --instance is badly shaped', () => {
    it('ERROR: {callArgs: [--instance, not-a-valid-id]} => rejects the id shape naming --instance rather than a raw ZodError', async () => {
      await expect(
        SiegelenseStatusLayerFlow({ callArgs: ['--instance', 'not-a-valid-id'] }),
      ).rejects.toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('the refusal when --instance names no value', () => {
    it('INVALID: {callArgs: [--instance]} => rejects naming the flag instead of silently printing the whole fleet', async () => {
      await expect(SiegelenseStatusLayerFlow({ callArgs: ['--instance'] })).rejects.toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });

  describe('the refusal for a flag status does not accept', () => {
    it('INVALID: {callArgs: [--human]} => rejects --human as an unknown flag, naming every accepted flag', async () => {
      await expect(SiegelenseStatusLayerFlow({ callArgs: ['--human'] })).rejects.toThrow(
        /^Unknown flag: --human\n\nAccepted flags: --instance, --branch, --since, --json\n\nUsage: dungeonmaster siegelense status \[--instance <instanceId>\] \[--branch <name>\] \[--since <1hr\|6hr\|1day\|beginning>\] \[--json\]$/u,
      );
    });
  });
});
