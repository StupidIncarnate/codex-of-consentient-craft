import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { StatusAnswerStub } from '../../../contracts/status-answer/status-answer.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';
import { machineStatics } from '../../../statics/machine/machine-statics';

import { statusReadBroker } from './status-read-broker';
import { statusReadBrokerProxy } from './status-read-broker.proxy';

const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';

describe('statusReadBroker', () => {
  describe('a fleet listing, no instance named', () => {
    it('VALID: {no instanceId, three registry rows, each with a real pgid} => one entry each, orphans stays empty since every row is alive', async () => {
      const proxy = statusReadBrokerProxy();
      const nowMs = 1_700_001_000_000;
      const ids = [
        InstanceIdStub({ value: 'inst_00000001' }),
        InstanceIdStub({ value: 'inst_00000002' }),
        InstanceIdStub({ value: 'inst_00000003' }),
      ];
      const entries = ids.map((id, index) =>
        RegistryEntryStub({
          id,
          guildId: null,
          specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
          pgids: [ProcessGroupIdStub({ value: 4_143_212 + index })],
          state: 'alive',
          bootedAtMs: EpochMsStub({ value: nowMs - 60_000 }),
          lastBeatMs: EpochMsStub({ value: nowMs - 1000 }),
        }),
      );
      const registry = RegistryStub({ instances: entries });

      proxy.setupNow({ nowMs });
      // The direct registryReadBroker() call that enumerates the fleet, plus one more per
      // instance — instanceStateResolveBroker reads the SAME registry.json again to resolve each
      // row's state.
      proxy.setupRegistryResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });

      // machineReadBroker runs BEFORE any instanceEntryLayerBroker assembly in statusReadBroker,
      // once every registry/instance-state resolution above has already drained the shared
      // path.join queue — see status-read-broker.proxy.ts.
      proxy.setupMachineReading({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
        diskBavail: 512_000,
        diskBsize: 4096,
        vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      });

      for (const id of ids) {
        const evidencePath = FilePathStub({ value: `${ROOT_PATH_VALUE}/unowned/instances/${id}` });
        proxy.setupEvidenceDir({
          homeDir: '/home/user',
          homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
          rootPath: FilePathStub({ value: ROOT_PATH_VALUE }),
          evidencePath,
        });
        proxy.setupHeartbeatMissing({
          homeDir: '/home/user',
          homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
          rootPath: FilePathStub({ value: ROOT_PATH_VALUE }),
          evidencePath,
        });
        proxy.setupRunsDirPathJoin({ evidencePath });
        proxy.setupRunsDirEntries({ evidencePath, entries: [] });
        proxy.setupProcListing({ pids: [] });
      }

      const result = await statusReadBroker({ instanceId: null });

      expect(result).toStrictEqual(
        StatusAnswerStub({
          monitored: [...machineStatics.monitored],
          machine: {
            freeMemMB: 980,
            totalMemMB: 16_000,
            freeDiskMB: 2000,
            cores: 8,
            loadAvg: [7.9, 6.2, 4.1],
            oomKillsSinceBoot: 2,
            lastOomAt: null,
          },
          instances: ids.map((id) => ({
            id,
            state: 'alive',
            specName: 'dungeonmaster-stack',
            uptime: '1m',
            lastBeat: '1s',
            runs: 0,
            rssMB: 0,
            rssAtLastBeat: null,
            lastStep: null,
            orphans: [],
            evidence: null,
            likelyCause: null,
            branch: null,
            evidenceComplete: true,
          })),
        }),
      );
    });
  });

  describe('an empty fleet', () => {
    it('EMPTY: {empty registry} => instances [] and a real machine block, monitored exactly machineStatics.monitored', async () => {
      const proxy = statusReadBrokerProxy();
      const nowMs = 1_700_001_000_000;
      const registry = RegistryStub({ instances: [] });

      proxy.setupNow({ nowMs });
      proxy.setupRegistryResolution({ registry });
      proxy.setupMachineReading({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
        diskBavail: 512_000,
        diskBsize: 4096,
        vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      });

      const result = await statusReadBroker({ instanceId: null });

      expect(result).toStrictEqual(
        StatusAnswerStub({
          monitored: [...machineStatics.monitored],
          machine: {
            freeMemMB: 980,
            totalMemMB: 16_000,
            freeDiskMB: 2000,
            cores: 8,
            loadAvg: [7.9, 6.2, 4.1],
            oomKillsSinceBoot: 2,
            lastOomAt: null,
          },
          instances: [],
        }),
      );
    });
  });

  describe('a named dead instance, with a completed run', () => {
    it('VALID: {instanceId named, a dead instance} => evidence, lastStep, orphans, rssAtLastBeat and likelyCause all populated', async () => {
      const proxy = statusReadBrokerProxy();
      const nowMs = 1_700_001_000_000;
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0000' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const evidencePath = FilePathStub({
        value: `${ROOT_PATH_VALUE}/guilds/${guildId}/instances/${instanceId}`,
      });
      const pgid = ProcessGroupIdStub({ value: 33_812 });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [pgid],
        state: 'alive',
        lastBeatMs: EpochMsStub({ value: nowMs - 240_000 }),
      });
      const registry = RegistryStub({ instances: [entry] });
      const heartbeat = InstanceHeartbeatStub({ instanceId, pgids: [pgid], rssMB: 2980 });

      proxy.setupNow({ nowMs });
      // statusReadBroker's named path resolves state directly through instanceStateResolveBroker —
      // never the fleet-wide enumeration.
      proxy.setupInstanceStateResolution({ registry });

      // machineReadBroker runs BEFORE any instanceEntryLayerBroker assembly in statusReadBroker,
      // once every registry/instance-state resolution above has already drained the shared
      // path.join queue — see status-read-broker.proxy.ts.
      proxy.setupMachineReading({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
        diskBavail: 512_000,
        diskBsize: 4096,
        vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      });

      const homeDir = '/home/user';
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const rootPath = FilePathStub({ value: ROOT_PATH_VALUE });

      proxy.setupEvidenceDir({ homeDir, homePath, rootPath, evidencePath });
      proxy.setupHeartbeatFound({
        homeDir,
        homePath,
        rootPath,
        evidencePath,
        heartbeat,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({
        evidencePath,
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
      });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProcListing({ pids: ['100'] });
      proxy.setupPidStatPathJoin({ pid: '100' });
      proxy.setupPidStat({ pid: '100', pgrp: 33_812, comm: 'node' });
      proxy.setupPidCmdlinePathJoin({ pid: '100' });
      proxy.setupOrphanCmdline({ pid: '100', argv: ['npm', 'run', 'dev:no-watch'] });
      proxy.setupOrphanAlive({ pgid });
      proxy.setupApiWebLogPathJoins({ evidencePath });
      proxy.setupApiLogPresent({ evidencePath });
      proxy.setupWebLogPresent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.siegelense' }),
        homeDir,
        homePath,
        rootPath,
      });
      proxy.setupTranscriptPathJoin({ evidencePath, runId: 'run_2' });
      proxy.setupTranscriptLines({
        evidencePath,
        runId: 'run_2',
        lines: [
          JSON.stringify(StepReadingStub({ step: 4 })),
          JSON.stringify(
            StepReadingStub({
              step: 7,
              shot: `${evidencePath}/runs/run_2/step7.png`,
            }),
          ),
        ],
      });

      const result = await statusReadBroker({ instanceId });

      expect(result).toStrictEqual(
        StatusAnswerStub({
          monitored: [...machineStatics.monitored],
          machine: {
            freeMemMB: 980,
            totalMemMB: 16_000,
            freeDiskMB: 2000,
            cores: 8,
            loadAvg: [7.9, 6.2, 4.1],
            oomKillsSinceBoot: 2,
            lastOomAt: null,
          },
          instances: [
            {
              id: instanceId,
              state: 'dead',
              specName: 'dungeonmaster-stack',
              uptime: null,
              lastBeat: '4m',
              runs: 2,
              rssMB: null,
              rssAtLastBeat: 2980,
              lastStep: { run: 'run_2', step: 7, verb: 'click' },
              orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
              evidence: {
                dir: {
                  path: `/repo/.siegelense/guilds/${guildId}/instances/${instanceId}`,
                  linkPresent: true,
                },
                transcript: 'run_2.jsonl',
                logs: ['api-server.log', 'web-server.log'],
                lastShot: 'run_2/step7.png',
              },
              likelyCause:
                'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
              branch: null,
              evidenceComplete: false,
            },
          ],
          queriedInstanceState: 'dead',
        }),
      );
    });
  });

  describe('a named instance the registry never held', () => {
    it("EMPTY: {instanceId named, no matching registry row} => instances [], queriedInstanceState 'unknown'", async () => {
      const proxy = statusReadBrokerProxy();
      const nowMs = 1_700_001_000_000;
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const registry = RegistryStub({ instances: [] });

      proxy.setupNow({ nowMs });
      // statusReadBroker's named path resolves state directly through instanceStateResolveBroker —
      // an empty registry means it finds no matching row, so the resolution is 'unknown'.
      proxy.setupInstanceStateResolution({ registry });
      proxy.setupMachineReading({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
        diskBavail: 512_000,
        diskBsize: 4096,
        vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      });

      const result = await statusReadBroker({ instanceId });

      expect(result).toStrictEqual(
        StatusAnswerStub({
          monitored: [...machineStatics.monitored],
          machine: {
            freeMemMB: 980,
            totalMemMB: 16_000,
            freeDiskMB: 2000,
            cores: 8,
            loadAvg: [7.9, 6.2, 4.1],
            oomKillsSinceBoot: 2,
            lastOomAt: null,
          },
          instances: [],
          queriedInstanceState: 'unknown',
        }),
      );
    });
  });

  describe('branch and since filtering', () => {
    it('VALID: {branch filter matches one of two instances} => only the matching branch is returned', async () => {
      const proxy = statusReadBrokerProxy();
      const nowMs = 1_700_001_000_000;
      const id1 = InstanceIdStub({ value: 'inst_00000001' });
      const id2 = InstanceIdStub({ value: 'inst_00000002' });
      const entry1 = RegistryEntryStub({
        id: id1,
        branch: 'feat/branch-a',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        state: 'alive',
        bootedAtMs: EpochMsStub({ value: nowMs - 60_000 }),
        lastBeatMs: EpochMsStub({ value: nowMs - 1000 }),
      });
      const entry2 = RegistryEntryStub({
        id: id2,
        branch: 'main',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        state: 'alive',
        bootedAtMs: EpochMsStub({ value: nowMs - 60_000 }),
        lastBeatMs: EpochMsStub({ value: nowMs - 1000 }),
      });
      const registry = RegistryStub({ instances: [entry1, entry2] });

      proxy.setupNow({ nowMs });
      proxy.setupRegistryResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });

      proxy.setupMachineReading({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
        diskBavail: 512_000,
        diskBsize: 4096,
        vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      });

      const evidencePath1 = FilePathStub({ value: `${ROOT_PATH_VALUE}/unowned/instances/${id1}` });
      proxy.setupEvidenceDir({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: ROOT_PATH_VALUE }),
        evidencePath: evidencePath1,
      });
      proxy.setupHeartbeatMissing({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: ROOT_PATH_VALUE }),
        evidencePath: evidencePath1,
      });
      proxy.setupRunsDirPathJoin({ evidencePath: evidencePath1 });
      proxy.setupRunsDirEntries({ evidencePath: evidencePath1, entries: [] });
      proxy.setupProcListing({ pids: [] });

      const result = await statusReadBroker({ instanceId: null, branch: 'feat/branch-a' });

      expect(result.instances).toStrictEqual([
        {
          id: id1,
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '1m',
          lastBeat: '1s',
          runs: 0,
          rssMB: 0,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: 'feat/branch-a',
          evidenceComplete: true,
        },
      ]);
    });

    it('VALID: {since filter 1h filters out instance active 2h ago} => only instances within the 1h window returned', async () => {
      const proxy = statusReadBrokerProxy();
      const nowMs = 1_700_001_000_000;
      const idRecent = InstanceIdStub({ value: 'inst_00000001' });
      const idOld = InstanceIdStub({ value: 'inst_00000002' });
      const entryRecent = RegistryEntryStub({
        id: idRecent,
        branch: 'main',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        state: 'alive',
        bootedAtMs: EpochMsStub({ value: nowMs - 60_000 }),
        lastBeatMs: EpochMsStub({ value: nowMs - 1000 }),
      });
      const entryOld = RegistryEntryStub({
        id: idOld,
        branch: 'main',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        state: 'alive',
        bootedAtMs: EpochMsStub({ value: nowMs - 7_200_000 }),
        lastBeatMs: EpochMsStub({ value: nowMs - 7_200_000 }),
      });
      const registry = RegistryStub({ instances: [entryRecent, entryOld] });

      proxy.setupNow({ nowMs });
      proxy.setupRegistryResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });
      proxy.setupInstanceStateResolution({ registry });

      proxy.setupMachineReading({
        freeMemBytes: 980 * 1_048_576,
        totalMemBytes: 16_000 * 1_048_576,
        coreCount: 8,
        loadAvg: [7.9, 6.2, 4.1],
        diskBavail: 512_000,
        diskBsize: 4096,
        vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      });

      const evidencePathRecent = FilePathStub({
        value: `${ROOT_PATH_VALUE}/unowned/instances/${idRecent}`,
      });
      proxy.setupEvidenceDir({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: ROOT_PATH_VALUE }),
        evidencePath: evidencePathRecent,
      });
      proxy.setupHeartbeatMissing({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: ROOT_PATH_VALUE }),
        evidencePath: evidencePathRecent,
      });
      proxy.setupRunsDirPathJoin({ evidencePath: evidencePathRecent });
      proxy.setupRunsDirEntries({ evidencePath: evidencePathRecent, entries: [] });
      proxy.setupProcListing({ pids: [] });

      const result = await statusReadBroker({ instanceId: null, since: '1h' });

      expect(result.instances).toStrictEqual([
        {
          id: idRecent,
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '1m',
          lastBeat: '1s',
          runs: 0,
          rssMB: 0,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: 'main',
          evidenceComplete: true,
        },
      ]);
    });
  });
});
