/**
 * PURPOSE: Drives `SiegelenseSnapshotsLayerFlow` through `snapshots`'s whole argv surface —
 * `--instance` (required) and `--json` — against a real `registry.json` under a fresh
 * `installTestbedCreateBroker` tree, matching how the `snapshots` cases in
 * `siegelense-flow.integration.test.ts` drive a real evidence tree with no mocks. A registry row
 * alone answers `killed`/`pruned`/`unknown`, but a POPULATED answer needs real captures on disk: a
 * snapshot store lives inside the instance's THROWAWAY HOME
 * (`locationsInstanceHomePathFindBroker`'s own header — under `os.tmpdir()`, never
 * `<repoRoot>/.dungeonmaster-assets/siegelense-assets`), which `flows/` cannot reach through a broker or a `.proxy.ts`
 * (`enforce-import-dependencies`, `enforce-test-proxy-imports`), and this file cannot reach through
 * `fs`/`os`/`path` either (the pre-edit lint hook refuses those in a test scenario file, integration
 * tests included). `snapshotStoreHarness` (`test/harnesses/snapshot-store/`) is the door through: it
 * mints a fresh `InstanceId` per run, writes the real index at the exact path
 * `locationsInstanceHomePathFindBroker` resolves for that id, and removes it on `cleanup` — a path
 * this suite owns rather than one it merely happens to share with another testbed's default.
 *
 * The populated fixture pins the two behaviours `snapshot-list-broker.test.ts` proves at the unit
 * layer: dedup keeps the latest capture of a repeated name (`clean` is captured at T-90m and
 * recaptured at T-5m; only the T-5m row — its `atMs` AND its `path` — survives), and the answer orders
 * oldest-first regardless of the raw append-log's own write order (the log is written with `clean`'s
 * first capture ahead of every automatic row, none of them in ascending `atMs` order). Every `atMs`
 * offset sits tens of minutes apart so `snapshotsAnswerRenderTransformer`'s AGE column stays
 * deterministic against the suite's own runtime — the same margin
 * `siegelense-status-layer-flow.integration.test.ts` uses for its `LAST BEAT` column — and the exact
 * rendered table below was verified against the transformer's own padding algorithm before being
 * pinned here as a literal.
 *
 * USAGE:
 * await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', 'inst_00005001'] });
 * // Writes the rendered SnapshotsAnswer for that instance to stdout
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { snapshotStoreHarness } from '../../../test/harnesses/snapshot-store/snapshot-store.harness';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../contracts/registry/registry.stub';
import { SnapshotRecordStub } from '../../contracts/snapshot-record/snapshot-record.stub';

import { SiegelenseSnapshotsLayerFlow } from './siegelense-snapshots-layer-flow';

const ALIVE_EMPTY_ID = InstanceIdStub({ value: 'inst_00005002' });
const KILLED_ID = InstanceIdStub({ value: 'inst_00005003' });
const PRUNED_ID = InstanceIdStub({ value: 'inst_00005004' });
const UNKNOWN_ID = InstanceIdStub({ value: 'inst_deadbeef' });

// Fixed relative to a single "now", captured once at module load — every offset is tens of minutes
// from its neighbours, far past any minute-rounding edge the suite's own runtime could cross.
const NOW_MS = Date.now();
const CLEAN_FIRST_CAPTURE_AT_MS = NOW_MS - 90 * 60_000;
const RUN_1_START_AT_MS = NOW_MS - 40 * 60_000;
const RUN_1_END_AT_MS = NOW_MS - 35 * 60_000;
const RUN_2_START_AT_MS = NOW_MS - 15 * 60_000;
const CLEAN_SURVIVING_AT_MS = NOW_MS - 5 * 60_000;

const REQUIRED_INSTANCE_MISSING_PATTERN =
  /^--instance is required: snapshots are held inside one instance's own throwaway home, so there is no fleet-wide form\.\n\nUsage: dungeonmaster siegelense snapshots --instance <instanceId> \[--json\]$/u;
const REQUIRED_INSTANCE_NO_VALUE_PATTERN =
  /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u;
const BAD_SHAPE_PATTERN =
  /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u;

describe('SiegelenseSnapshotsLayerFlow', () => {
  const store = snapshotStoreHarness();
  const ALIVE_POPULATED_ID = store.mintInstanceId();

  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-snapshots-layer-flow' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  const cleanDiscardedPath = store.payloadPath({ instanceId: ALIVE_POPULATED_ID, ordinal: 1 });
  const run1StartPath = store.payloadPath({ instanceId: ALIVE_POPULATED_ID, ordinal: 2 });
  const run1EndPath = store.payloadPath({ instanceId: ALIVE_POPULATED_ID, ordinal: 3 });
  const run2StartPath = store.payloadPath({ instanceId: ALIVE_POPULATED_ID, ordinal: 4 });
  const cleanSurvivingPath = store.payloadPath({ instanceId: ALIVE_POPULATED_ID, ordinal: 5 });

  beforeAll(async () => {
    // `dungeonmaster init` mkdir -p's this directory at install time, matching
    // siegelense-status-layer-flow.integration.test.ts's own beforeAll precondition.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'siegelense/.keep' }),
      content: FileContentStub({ value: '' }),
    });

    const registry = RegistryStub({
      instances: [
        RegistryEntryStub({
          id: ALIVE_POPULATED_ID,
          state: 'alive',
          bootedAtMs: NOW_MS - 600_000,
          lastBeatMs: NOW_MS - 2_000,
        }),
        RegistryEntryStub({
          id: ALIVE_EMPTY_ID,
          state: 'alive',
          bootedAtMs: NOW_MS - 600_000,
          lastBeatMs: NOW_MS - 2_000,
        }),
        RegistryEntryStub({
          id: KILLED_ID,
          state: 'killed',
        }),
        RegistryEntryStub({
          id: PRUNED_ID,
          state: 'pruned',
          prunedAtMs: NOW_MS,
          prunedByRule: 'olderThan 7d',
        }),
      ],
    });

    testbed.writeFile({
      relativePath: RelativePathStub({
        value: `${locationsStatics.siegelense.dir}/${locationsStatics.siegelense.registry}`,
      }),
      content: FileContentStub({ value: `${JSON.stringify(registry)}\n` }),
    });

    // Written in CAPTURE order (`clean`'s first capture predates every automatic row), never in
    // ascending `atMs` order, so a passing ordering assertion proves the collapse-and-sort really
    // runs rather than the answer merely mirroring the file's own line order.
    const rawIndexRecords = [
      SnapshotRecordStub({
        name: 'clean',
        atMs: CLEAN_FIRST_CAPTURE_AT_MS,
        manual: true,
        path: cleanDiscardedPath,
      }),
      SnapshotRecordStub({
        name: 'run_1:start',
        atMs: RUN_1_START_AT_MS,
        manual: false,
        path: run1StartPath,
      }),
      SnapshotRecordStub({
        name: 'run_1:end',
        atMs: RUN_1_END_AT_MS,
        manual: false,
        path: run1EndPath,
      }),
      SnapshotRecordStub({
        name: 'run_2:start',
        atMs: RUN_2_START_AT_MS,
        manual: false,
        path: run2StartPath,
      }),
      SnapshotRecordStub({
        name: 'clean',
        atMs: CLEAN_SURVIVING_AT_MS,
        manual: true,
        path: cleanSurvivingPath,
      }),
    ];

    await store.writeIndex({ instanceId: ALIVE_POPULATED_ID, records: rawIndexRecords });
  });

  afterAll(async () => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
    await store.cleanup();
  });

  describe('the --instance flag missing entirely', () => {
    it('INVALID: {callArgs: []} => rejects naming --instance, there being no fleet-wide form', async () => {
      await expect(SiegelenseSnapshotsLayerFlow({ callArgs: [] })).rejects.toThrow(
        REQUIRED_INSTANCE_MISSING_PATTERN,
      );
    });
  });

  describe('the --instance flag naming no value', () => {
    it('INVALID: {callArgs: [--instance]} => rejects with the flag-value refusal, not a raw ZodError', async () => {
      await expect(SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance'] })).rejects.toThrow(
        REQUIRED_INSTANCE_NO_VALUE_PATTERN,
      );
    });
  });

  describe('the --instance flag badly shaped', () => {
    it('ERROR: {callArgs: [--instance, not-a-valid-id]} => rejects the id shape naming --instance rather than a raw ZodError', async () => {
      await expect(
        SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', 'not-a-valid-id'] }),
      ).rejects.toThrow(BAD_SHAPE_PATTERN);
    });
  });

  describe('an --instance value the registry never held', () => {
    it('VALID: {callArgs: [--instance, <unknown id>]} => renders instanceState unknown, never a throw', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', UNKNOWN_ID] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        `INSTANCE: ${UNKNOWN_ID} (unknown)\nSNAPSHOTS: none recorded yet\n`,
      ]);
    });

    it('VALID: {callArgs: [--instance, <unknown id>, --json]} => the JSON names it unknown, distinct from an empty fleet', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', UNKNOWN_ID, '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        instanceId: UNKNOWN_ID,
        instanceState: 'unknown',
        snapshots: [],
      });
    });
  });

  describe('a killed instance — the throwaway home, and any store inside it, is gone', () => {
    it('VALID: {callArgs: [--instance, <killed id>]} => renders an empty list under instanceState killed', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', KILLED_ID] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        `INSTANCE: ${KILLED_ID} (killed)\nSNAPSHOTS: none recorded yet\n`,
      ]);
    });

    it('VALID: {callArgs: [--instance, <killed id>, --json]} => the JSON carries instanceState killed with an empty list', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', KILLED_ID, '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        instanceId: KILLED_ID,
        instanceState: 'killed',
        snapshots: [],
      });
    });
  });

  describe('a pruned instance — a distinct empty state from killed', () => {
    it('VALID: {callArgs: [--instance, <pruned id>]} => renders an empty list under instanceState pruned', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', PRUNED_ID] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        `INSTANCE: ${PRUNED_ID} (pruned)\nSNAPSHOTS: none recorded yet\n`,
      ]);
    });

    it('VALID: {callArgs: [--instance, <pruned id>, --json]} => the JSON carries instanceState pruned with an empty list', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', PRUNED_ID, '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        instanceId: PRUNED_ID,
        instanceState: 'pruned',
        snapshots: [],
      });
    });
  });

  describe('an alive instance that has captured nothing yet — empty for a different reason than killed', () => {
    it('EMPTY: {callArgs: [--instance, <alive, no captures>]} => renders an empty list under instanceState alive', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', ALIVE_EMPTY_ID] });

      process.stdout.write = originalWrite;

      expect(writes).toStrictEqual([
        `INSTANCE: ${ALIVE_EMPTY_ID} (alive)\nSNAPSHOTS: none recorded yet\n`,
      ]);
    });

    it('EMPTY: {callArgs: [--instance, <alive, no captures>, --json]} => the JSON carries instanceState alive with an empty list', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', ALIVE_EMPTY_ID, '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        instanceId: ALIVE_EMPTY_ID,
        instanceState: 'alive',
        snapshots: [],
      });
    });
  });

  describe('an alive instance with a real, populated snapshot store on disk', () => {
    it('VALID: {callArgs: [--instance, <populated id>]} => renders every current row oldest-first, the stale "clean" capture dropped by dedup', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', ALIVE_POPULATED_ID] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput).toBe(
        `INSTANCE: ${ALIVE_POPULATED_ID} (alive)\n` +
          '┌─────────────┬─────┬────────┐\n' +
          '│ NAME        │ AGE │ MANUAL │\n' +
          '├─────────────┼─────┼────────┤\n' +
          '│ run_1:start │ 40m │ false  │\n' +
          '│ run_1:end   │ 35m │ false  │\n' +
          '│ run_2:start │ 15m │ false  │\n' +
          '│ clean       │ 5m  │ true   │\n' +
          '└─────────────┴─────┴────────┘\n',
      );
    });

    it('VALID: {callArgs: [--instance, <populated id>, --json]} => the JSON lists every current row oldest-first, "clean" carrying its LATEST atMs and path', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseSnapshotsLayerFlow({
        callArgs: ['--instance', ALIVE_POPULATED_ID, '--json'],
      });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        instanceId: ALIVE_POPULATED_ID,
        instanceState: 'alive',
        snapshots: [
          { name: 'run_1:start', atMs: RUN_1_START_AT_MS, manual: false, path: run1StartPath },
          { name: 'run_1:end', atMs: RUN_1_END_AT_MS, manual: false, path: run1EndPath },
          { name: 'run_2:start', atMs: RUN_2_START_AT_MS, manual: false, path: run2StartPath },
          { name: 'clean', atMs: CLEAN_SURVIVING_AT_MS, manual: true, path: cleanSurvivingPath },
        ],
      });
    });
  });
});
