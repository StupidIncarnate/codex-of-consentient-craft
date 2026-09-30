/**
 * Drives `prune` against a REAL tree on disk — a real registry, real evidence files with real
 * sizes, a real `quest.json` carrying a real `walked` note, and a real `.quest-plans/` directory
 * carrying a real `VERIFIED` prelude. Nothing is mocked. Three sweeps run in order, and the
 * assertions are the four ways this call can pass a test while being dangerous: the window protects
 * fresh evidence; `prune { instance }` takes that instance's files and leaves the NEIGHBOUR's where
 * they are; a cited instance is REFUSED with the real citing paths and the real run id in the
 * sentence; and a live instance's assets are never taken whatever the window says.
 *
 * The window is exercised with `0s` on the sweeps that must delete, because there is no adapter
 * here for backdating an mtime and a file written by the suite is seconds old — `0s` is the
 * explicit "everything up to this instant" form the parser accepts for exactly this.
 */

import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';
import { ensureDir, statIfExists, writeFile } from '#gateway/node/fs__promises';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestNoteStub } from '@dungeonmaster/shared/contracts/quest-note/quest-note.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SiegeInstanceIdStub } from '@dungeonmaster/shared/contracts/siege-instance-id/siege-instance-id.stub';
import { SiegeRunIdStub } from '@dungeonmaster/shared/contracts/siege-run-id/siege-run-id.stub';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceOwnerStub } from '../../../contracts/instance-owner/instance-owner.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { PruneQueryStub } from '../../../contracts/prune-query/prune-query.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecHashStub } from '../../../contracts/spec-hash/spec-hash.stub';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { registryWriteBroker } from '../../registry/write/registry-write-broker';
import { pruneRunBroker } from './prune-run-broker';

const DAY_MS = 86_400_000;
const CITED_ID = InstanceIdStub({ value: 'inst_1111c17e' });
const UNCITED_ID = InstanceIdStub({ value: 'inst_2222faaa' });
const NEIGHBOUR_ID = InstanceIdStub({ value: 'inst_3333beef' });
const LIVE_ID = InstanceIdStub({ value: 'inst_4444a11e' });
const DRY_RUN_ID = InstanceIdStub({ value: 'inst_5555d0e5' });
const GUILD = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const QUEST = QuestIdStub({ value: 'add-auth' });

// 3 MiB exactly, so `freedMB` has a whole number to report and `freedBytes` a checkable one.
const LOG_BYTES = 3 * 1024 * 1024;
const TRANSCRIPT_TEXT = '{"step":1}\n';
const SHOT_TEXT = 'PNG';
const TREE_BYTES = LOG_BYTES + TRANSCRIPT_TEXT.length + SHOT_TEXT.length;

describe('prune, against a real evidence tree', () => {
  const testbed = installTestbedCreateBroker({ baseName: 'prune-run' });
  const originalHome = getEnv('DUNGEONMASTER_HOME');
  const nowMs = Date.now();
  const worktreePath = `${testbed.guildPath}/worktree`;
  const questFolder = `${testbed.guildPath}/guilds/${GUILD}/quests/${QUEST}`;
  const questFile = `${questFolder}/quest.json`;
  const plansDir = `${worktreePath}/.quest-plans`;
  const preludeFile = `${plansDir}/path-3.md`;

  let citedEvidence: ReturnType<typeof locationsInstanceEvidencePathFindBroker> | null = null;
  let uncitedEvidence: ReturnType<typeof locationsInstanceEvidencePathFindBroker> | null = null;
  let neighbourEvidence: ReturnType<typeof locationsInstanceEvidencePathFindBroker> | null = null;
  let liveEvidence: ReturnType<typeof locationsInstanceEvidencePathFindBroker> | null = null;
  let dryRunEvidence: ReturnType<typeof locationsInstanceEvidencePathFindBroker> | null = null;
  let freshWindowSweep: Awaited<ReturnType<typeof pruneRunBroker>> | null = null;
  let neighbourSweep: Awaited<ReturnType<typeof pruneRunBroker>> | null = null;
  let fleetSweep: Awaited<ReturnType<typeof pruneRunBroker>> | null = null;
  let dryRunSweep: Awaited<ReturnType<typeof pruneRunBroker>> | null = null;
  let neighbourLogAfterScopedSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let uncitedLogAfterScopedSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let citedLogAfterScopedSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let uncitedLogAfterFleetSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let citedLogAfterFleetSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let liveLogAfterFleetSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let dryRunLogAfterSweep: Awaited<ReturnType<typeof statIfExists>> = null;
  let dryRunRegistryAfterDryRunSweep: Awaited<ReturnType<typeof registryReadBroker>> | null = null;
  let registryAfter: Awaited<ReturnType<typeof registryReadBroker>> | null = null;

  beforeAll(async () => {
    setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
    await ensureDir(`${testbed.guildPath}/siegelense`);

    await registryWriteBroker({
      registry: {
        instances: [
          RegistryEntryStub({
            id: CITED_ID,
            owner: InstanceOwnerStub(),
            specName: 'dungeonmaster-stack',
            specHash: SpecHashStub(),
            pid: null,
            pgids: [],
            socketPath: null,
            ports: PortPairStub({ api: 41_001, web: 41_002 }),
            state: 'killed',
            questId: QUEST,
            guildId: GUILD,
            reservedAtMs: (nowMs - DAY_MS * 40),
            bootedAtMs: (nowMs - DAY_MS * 40),
            lastBeatMs: null,
            prunedAtMs: null,
            prunedByRule: null,
          }),
          RegistryEntryStub({
            id: UNCITED_ID,
            owner: InstanceOwnerStub(),
            specName: 'dungeonmaster-stack',
            specHash: SpecHashStub(),
            pid: null,
            pgids: [],
            socketPath: null,
            ports: PortPairStub({ api: 41_011, web: 41_012 }),
            state: 'killed',
            questId: null,
            guildId: null,
            reservedAtMs: (nowMs - DAY_MS * 40),
            bootedAtMs: (nowMs - DAY_MS * 40),
            lastBeatMs: null,
            prunedAtMs: null,
            prunedByRule: null,
          }),
          RegistryEntryStub({
            id: NEIGHBOUR_ID,
            owner: InstanceOwnerStub(),
            specName: 'dungeonmaster-stack',
            specHash: SpecHashStub(),
            pid: null,
            pgids: [],
            socketPath: null,
            ports: PortPairStub({ api: 41_021, web: 41_022 }),
            state: 'killed',
            questId: null,
            guildId: null,
            reservedAtMs: (nowMs - DAY_MS * 40),
            bootedAtMs: (nowMs - DAY_MS * 40),
            lastBeatMs: null,
            prunedAtMs: null,
            prunedByRule: null,
          }),
          RegistryEntryStub({
            id: LIVE_ID,
            owner: InstanceOwnerStub(),
            specName: 'dungeonmaster-stack',
            specHash: SpecHashStub(),
            pid: null,
            pgids: [],
            socketPath: null,
            ports: PortPairStub({ api: 41_031, web: 41_032 }),
            state: 'alive',
            questId: null,
            guildId: null,
            reservedAtMs: (nowMs - 120_000),
            bootedAtMs: (nowMs - 120_000),
            lastBeatMs: (nowMs - 2000),
            prunedAtMs: null,
            prunedByRule: null,
          }),
          RegistryEntryStub({
            id: DRY_RUN_ID,
            owner: InstanceOwnerStub(),
            specName: 'dungeonmaster-stack',
            specHash: SpecHashStub(),
            pid: null,
            pgids: [],
            socketPath: null,
            ports: PortPairStub({ api: 41_041, web: 41_042 }),
            state: 'killed',
            questId: null,
            guildId: null,
            reservedAtMs: (nowMs - DAY_MS * 40),
            bootedAtMs: (nowMs - DAY_MS * 40),
            lastBeatMs: null,
            prunedAtMs: null,
            prunedByRule: null,
          }),
        ],
      },
    });

    citedEvidence = locationsInstanceEvidencePathFindBroker({
      instanceId: CITED_ID,
      guildId: GUILD,
    });
    uncitedEvidence = locationsInstanceEvidencePathFindBroker({
      instanceId: UNCITED_ID,
      guildId: null,
    });
    neighbourEvidence = locationsInstanceEvidencePathFindBroker({
      instanceId: NEIGHBOUR_ID,
      guildId: null,
    });
    liveEvidence = locationsInstanceEvidencePathFindBroker({ instanceId: LIVE_ID, guildId: null });
    dryRunEvidence = locationsInstanceEvidencePathFindBroker({
      instanceId: DRY_RUN_ID,
      guildId: null,
    });

    const body = 'x'.repeat(LOG_BYTES);

    await Promise.all(
      [citedEvidence, uncitedEvidence, neighbourEvidence, liveEvidence, dryRunEvidence].map(
        async (evidenceDir) => {
          await ensureDir(`${evidenceDir}/runs/run_2`);
          await writeFile(`${evidenceDir}/api-server.log`, body);
          await writeFile(
            `${evidenceDir}/runs/run_2.jsonl`,
            TRANSCRIPT_TEXT,
          );
          await writeFile(
            `${evidenceDir}/runs/run_2/step1.png`,
            SHOT_TEXT,
          );
        },
      ),
    );

    // The quest the cited instance was started for: OPEN, with a walked note naming it and run_2,
    // and a worktree holding a prelude whose VERIFIED line names run_2 too.
    await ensureDir(questFolder);
    await ensureDir(plansDir);
    await writeFile(
      questFile,
      JSON.stringify(
          QuestStub({
            id: QUEST,
            status: 'in_progress',
            worktreePath: worktreePath,
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-path-3',
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: String(CITED_ID) }),
                  runId: SiegeRunIdStub({ value: 'run_2' }),
                }),
              ],
            },
          }),
        ),
    );
    await writeFile(
      preludeFile,
      '# PATH 3\n  VERIFIED  run_2 · 2026-09-14 · prelude reached the entry\n',
    );

    // Sweep 1 — the default window over files the suite wrote seconds ago.
    freshWindowSweep = await pruneRunBroker({
      query: PruneQueryStub({ instanceId: null, kind: null, olderThan: '7d' }),
    });

    // Sweep 2 — one instance, everything up to this instant.
    neighbourSweep = await pruneRunBroker({
      query: PruneQueryStub({ instanceId: NEIGHBOUR_ID, kind: null, olderThan: '0s' }),
    });
    neighbourLogAfterScopedSweep = await statIfExists(`${neighbourEvidence}/api-server.log`);
    uncitedLogAfterScopedSweep = await statIfExists(`${uncitedEvidence}/api-server.log`);
    citedLogAfterScopedSweep = await statIfExists(`${citedEvidence}/api-server.log`);

    // Sweep 2.5 — a dry run, scoped to its own instance so sweep 3's real fleet-wide sweep below
    // (which would otherwise genuinely take this same instance) cannot contaminate what this proves.
    // Captured HERE, before sweep 3 runs, for the same reason siegelense-prune-layer-flow's own
    // integration test captures BOUNDARY_ID's state between two sweeps: reading disk from an `it()`
    // would only ever see the state AFTER every beforeAll sweep has run.
    dryRunSweep = await pruneRunBroker({
      query: PruneQueryStub({ instanceId: DRY_RUN_ID, kind: null, olderThan: '0s' }),
      dryRun: true,
    });
    dryRunLogAfterSweep = await statIfExists(`${dryRunEvidence}/api-server.log`);
    dryRunRegistryAfterDryRunSweep = await registryReadBroker();

    // Sweep 3 — the whole fleet, everything up to this instant.
    fleetSweep = await pruneRunBroker({
      query: PruneQueryStub({ instanceId: null, kind: null, olderThan: '0s' }),
    });
    uncitedLogAfterFleetSweep = await statIfExists(`${uncitedEvidence}/api-server.log`);
    citedLogAfterFleetSweep = await statIfExists(`${citedEvidence}/api-server.log`);
    liveLogAfterFleetSweep = await statIfExists(`${liveEvidence}/api-server.log`);
    registryAfter = await registryReadBroker();
  }, 60_000);

  afterAll(() => {
    if (originalHome === undefined) {
      deleteEnv('DUNGEONMASTER_HOME');
    } else {
      setEnv('DUNGEONMASTER_HOME', originalHome);
    }
    testbed.cleanup();
  });

  describe('the window', () => {
    it('VALID: {olderThan 7d over evidence written seconds ago} => nothing taken and nothing freed', () => {
      expect(freshWindowSweep?.removed).toStrictEqual([]);
      expect(freshWindowSweep?.freedBytes).toBe(0);
    });

    it('VALID: {the same sweep} => the LIVE instance is still refused by name, because the window is not what protects it', () => {
      expect(freshWindowSweep?.refused).toStrictEqual([
        { id: String(LIVE_ID), why: 'live — last beat 2s ago' },
      ]);
    });
  });

  describe('prune scoped to one instance', () => {
    it('VALID: {--instance the neighbour} => that instance alone is reported, with the real bytes its tree held', () => {
      expect(neighbourSweep?.removed).toStrictEqual([
        {
          id: String(NEIGHBOUR_ID),
          kind: null,
          freedBytes: TREE_BYTES,
          freedMB: 3,
          tombstoned: true,
        },
      ]);
    });

    it("VALID: {--instance the neighbour} => the neighbour's own log is gone from disk", () => {
      expect(neighbourLogAfterScopedSweep).toBe(null);
    });

    it('VALID: {--instance the neighbour} => the UNCITED instance next door still has its log, byte for byte', () => {
      expect(uncitedLogAfterScopedSweep?.sizeBytes).toBe(LOG_BYTES);
    });

    it('VALID: {--instance the neighbour} => the CITED instance next door still has its log too', () => {
      expect(citedLogAfterScopedSweep?.sizeBytes).toBe(LOG_BYTES);
    });

    it('VALID: {--instance the neighbour, no quest at all} => the answer still names open-issue as unchecked, because that gap is permanent, not conditioned on quest ownership', () => {
      expect(neighbourSweep?.unresolved.map((gap) => gap.kind)).toStrictEqual(['open-issue']);
    });
  });

  describe('a fleet sweep past the window', () => {
    it('VALID: {a walked note and a VERIFIED prelude both naming run_2} => refused, and the sentence carries the real quest file, the real prelude path and the real run id', () => {
      expect(
        fleetSweep?.refused.filter((row) => String(row.id) === String(CITED_ID)),
      ).toStrictEqual([
        {
          id: String(CITED_ID),
          why:
            `run_2 cited by a WALKED note on open quest add-auth (in_progress) in ${questFile}; ` +
            `run_2 cited by a VERIFIED prelude in ${preludeFile}`,
        },
      ]);
    });

    it('VALID: {the cited instance} => its log is still on disk after the sweep that refused it', () => {
      expect(citedLogAfterFleetSweep?.sizeBytes).toBe(LOG_BYTES);
    });

    it('VALID: {the uncited instance} => taken, with freedBytes equal to the bytes that were really there', () => {
      expect(
        fleetSweep?.removed.filter((row) => String(row.id) === String(UNCITED_ID)),
      ).toStrictEqual([
        {
          id: String(UNCITED_ID),
          kind: null,
          freedBytes: TREE_BYTES,
          freedMB: 3,
          tombstoned: true,
        },
      ]);
    });

    it('VALID: {the uncited instance} => its log is genuinely gone from disk', () => {
      expect(uncitedLogAfterFleetSweep).toBe(null);
    });

    it('VALID: {the live instance} => refused, and its log is untouched whatever the window said', () => {
      expect(fleetSweep?.refused.filter((row) => String(row.id) === String(LIVE_ID))).toStrictEqual(
        [{ id: String(LIVE_ID), why: 'live — last beat 2s ago' }],
      );
      expect(liveLogAfterFleetSweep?.sizeBytes).toBe(LOG_BYTES);
    });

    it('VALID: {a fully taken tree} => the registry row is a tombstone carrying when and by which rule', () => {
      const row = registryAfter?.instances.find((entry) => String(entry.id) === String(UNCITED_ID));

      expect(String(row?.state)).toBe('pruned');
      expect(String(row?.prunedByRule)).toBe('olderThan 0s');
    });

    it('VALID: {a sweep touching a quest-owned instance} => the answer names open-issue as never checked, rather than reporting silence as "nothing cites this"', () => {
      expect(fleetSweep?.unresolved.map((gap) => gap.kind)).toStrictEqual(['open-issue']);
    });
  });

  describe('dryRun: true (DEF-49)', () => {
    it('VALID: {--instance the dry-run instance, --older-than 0s, dryRun: true} => reports the removal it would have made, with the real bytes its tree held', () => {
      expect(dryRunSweep?.removed).toStrictEqual([
        {
          id: String(DRY_RUN_ID),
          kind: null,
          freedBytes: TREE_BYTES,
          freedMB: 3,
          tombstoned: true,
        },
      ]);
    });

    it('VALID: {the same dry run} => its log is still on disk — nothing was actually unlinked', () => {
      expect(dryRunLogAfterSweep?.sizeBytes).toBe(LOG_BYTES);
    });

    it('VALID: {the same dry run} => the registry row is untouched, not tombstoned — nothing on disk changed to justify one', () => {
      const row = dryRunRegistryAfterDryRunSweep?.instances.find(
        (entry) => String(entry.id) === String(DRY_RUN_ID),
      );

      expect(String(row?.state)).toBe('killed');
      expect(row?.prunedAtMs).toBe(null);
      expect(row?.prunedByRule).toBe(null);
    });
  });
});
