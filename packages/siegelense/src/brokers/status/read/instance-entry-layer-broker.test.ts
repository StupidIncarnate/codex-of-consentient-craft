import { ContentTextStub, FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../../contracts/instance-state/instance-state.stub';
import { InstanceStatusStub } from '../../../contracts/instance-status/instance-status.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';

const NO_PROFILE = SpecProfileStub({ samples: [], fromRuns: 0, measuredAt: null, bootMs: null });

import { instanceEntryLayerBroker } from './instance-entry-layer-broker';
import { instanceEntryLayerBrokerProxy } from './instance-entry-layer-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

describe('instanceEntryLayerBroker', () => {
  describe('an alive instance, not named', () => {
    it('VALID: {alive, unnamed, empty pgids} => uptime, lastBeat and rssMB populated; lastStep and evidence stay null', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId: null,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        bootedAtMs: EpochMsStub({ value: 1_700_000_160_000 }),
        lastBeatMs: EpochMsStub({ value: 1_700_000_998_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupProcListing({ pids: [] });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'alive' }),
        named: false,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '14m',
          lastBeat: '2s',
          runs: 0,
          rssMB: 0,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
        }),
      );
    });

    it("VALID: {alive, unnamed, two real pgids} => orphans stays empty — those pgids are the instance's own lane, not a leak", async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c22' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c22',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId: null,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [ProcessGroupIdStub({ value: 4_143_212 }), ProcessGroupIdStub({ value: 4_143_213 })],
        bootedAtMs: EpochMsStub({ value: 1_700_000_160_000 }),
        lastBeatMs: EpochMsStub({ value: 1_700_000_998_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupProcListing({ pids: [] });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'alive' }),
        named: false,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '14m',
          lastBeat: '2s',
          runs: 0,
          rssMB: 0,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
        }),
      );
    });
  });

  describe('a dead instance, named, before any run left a transcript', () => {
    it('EMPTY: {dead, named, no runs yet, evidence directory absent} => evidence carries the dir and an empty file list', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0001' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0001',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'dead' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'dead',
          specName: 'dungeonmaster-stack',
          uptime: null,
          lastBeat: '4m',
          runs: 0,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0001',
              linkPresent: true,
            },
            files: [],
          },
          likelyCause: 'memory unavailable at last beat; kernel OOM events unavailable',
        }),
      );
    });

    it('VALID: {dead, named, only driver.log on disk} => evidence.files carries driver.log as an absolute repo-local path with its size', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0005' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0005',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0005`,
        files: [{ name: 'driver.log', bytes: 812 }],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'dead' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'dead',
          specName: 'dungeonmaster-stack',
          uptime: null,
          lastBeat: '4m',
          runs: 0,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0005',
              linkPresent: true,
            },
            files: [
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0005/driver.log',
                bytes: 812,
              },
            ],
          },
          likelyCause: 'memory unavailable at last beat; kernel OOM events unavailable',
        }),
      );
    });

    it('VALID: {dead, named, a recorded shutdown reason} => likelyCause is the recorded reason, and the memory/OOM text never enters it', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0004' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0004',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });
      const heartbeat = InstanceHeartbeatStub({ instanceId, pgids: [], rssMB: 622 });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatFound({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        heartbeat,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonFound({
        evidencePath,
        marker: ShutdownReasonStub({
          reason: ContentTextStub({
            value: 'reaped by idle timeout after 900s with no run received',
          }),
        }),
      });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0004`,
        files: [
          { name: 'shutdown-reason.json', bytes: 70 },
          { name: 'heartbeat.json', bytes: 90 },
        ],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'dead' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: ReadingCountStub({ value: 1 }),
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'dead',
          specName: 'dungeonmaster-stack',
          uptime: null,
          lastBeat: '4m',
          runs: 0,
          rssMB: null,
          rssAtLastBeat: 622,
          lastStep: null,
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0004',
              linkPresent: true,
            },
            files: [
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0004/heartbeat.json',
                bytes: 90,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0004/shutdown-reason.json',
                bytes: 70,
              },
            ],
          },
          likelyCause: 'reaped by idle timeout after 900s with no run received',
        }),
      );
    });
  });

  describe('a dead instance, named, with a completed run', () => {
    it("VALID: {dead, named, one prior run and a dying run} => last beat, last step, rssAtLastBeat, orphan pgids and every evidence file (both runs' shots and the video) populated", async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0000' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000',
      });
      const pgid = ProcessGroupIdStub({ value: 33_812 });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [pgid],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });
      const heartbeat = InstanceHeartbeatStub({
        instanceId,
        pgids: [pgid],
        rssMB: 2980,
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatFound({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
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
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: ['100'] });
      proxy.setupPidStatPathJoin({ pid: '100' });
      proxy.setupPidStat({ pid: '100', pgrp: 33_812, comm: 'node' });
      proxy.setupPidCmdlinePathJoin({ pid: '100' });
      proxy.setupOrphanCmdline({ pid: '100', argv: ['npm', 'run', 'dev:no-watch'] });
      proxy.setupOrphanAlive({ pgid });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000`,
        files: [
          { name: 'web-server.log', bytes: 300 },
          { name: 'api-server.log', bytes: 1200 },
        ],
        dirs: ['video', 'runs'],
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs`,
        files: [
          { name: 'run_2.jsonl', bytes: 2000 },
          { name: 'run_1.jsonl', bytes: 4000 },
          { name: 'run_1.json', bytes: 5000 },
        ],
        dirs: ['run_2', 'run_1'],
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_1`,
        files: [{ name: 'step1.png', bytes: 50000 }],
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_2`,
        files: [{ name: 'step7.png', bytes: 51000 }],
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/video`,
        files: [{ name: '703547507e7caf9bcbc8328daae3e4d1.webm', bytes: 860132 }],
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
              shot: '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_2/step7.png',
            }),
          ),
        ],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'dead' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
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
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000',
              linkPresent: true,
            },
            files: [
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/api-server.log',
                bytes: 1200,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_1/step1.png',
                bytes: 50000,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_1.json',
                bytes: 5000,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_1.jsonl',
                bytes: 4000,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_2/step7.png',
                bytes: 51000,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/runs/run_2.jsonl',
                bytes: 2000,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/video/703547507e7caf9bcbc8328daae3e4d1.webm',
                bytes: 860132,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/web-server.log',
                bytes: 300,
              },
            ],
          },
          likelyCause:
            'memory 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
          evidenceComplete: false,
        }),
      );
    });
  });

  describe('a dead instance whose spec has a recorded solo profile', () => {
    it('VALID: {dead, named, memory 609 at last beat, a pool-1 profile of peak 609 / steady 488 from 5 runs} => likelyCause quotes the profile instead of denying one exists', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_e3dd0006' });
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_e3dd0006',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId: null,
        specName: SpecNameStub({ value: 'stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });
      const heartbeat = InstanceHeartbeatStub({ instanceId, pgids: [], rssMB: 609 });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatFound({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        heartbeat,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({
        profile: SpecProfileStub({
          specName: 'stack',
          samples: [{ poolSize: 1, steadyMB: 488, peakMB: 609, runs: 5 }],
        }),
      });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'dead' }),
        named: true,
        nowMs: EpochMsStub({ value: 1_700_001_000_000 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'dead',
          specName: 'stack',
          uptime: null,
          lastBeat: '4m',
          runs: 0,
          rssMB: null,
          rssAtLastBeat: 609,
          lastStep: null,
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e3dd0006',
              linkPresent: true,
            },
            files: [],
          },
          likelyCause:
            'memory 609MB at last beat; profile 609MB peak / 488MB steady at pool size 1, from 5 runs; kernel OOM kills since boot: 0',
        }),
      );
    });
  });

  describe('a killed instance, named, distinguishing a clean stop from a crash mid-run', () => {
    it('VALID: {killed, named, run_1 finished cleanly} => evidenceComplete true and likelyCause null, because a plain kill is deliberate', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0002' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({ evidencePath, entries: ['run_1.jsonl', 'run_1.json'] });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002`,
        files: [],
        dirs: ['runs'],
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002/runs`,
        files: [
          { name: 'run_1.jsonl', bytes: 800 },
          { name: 'run_1.json', bytes: 900 },
        ],
        dirs: ['run_1'],
      });
      proxy.setupEvidenceTreeDir({
        dirPath: `/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002/runs/run_1`,
        files: [{ name: 'step3.png', bytes: 40000 }],
      });
      proxy.setupTranscriptPathJoin({ evidencePath, runId: 'run_1' });
      proxy.setupTranscriptLines({
        evidencePath,
        runId: 'run_1',
        lines: [JSON.stringify(StepReadingStub({ step: 3 }))],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'killed' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'killed',
          specName: 'dungeonmaster-stack',
          uptime: null,
          lastBeat: '4m',
          runs: 1,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: { run: 'run_1', step: 3, verb: 'click' },
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002',
              linkPresent: true,
            },
            files: [
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002/runs/run_1/step3.png',
                bytes: 40000,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002/runs/run_1.json',
                bytes: 900,
              },
              {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002/runs/run_1.jsonl',
                bytes: 800,
              },
            ],
          },
          likelyCause: null,
          evidenceComplete: true,
        }),
      );
    });

    it('VALID: {killed, named, run_2 crashed mid-step with no run_2.json} => evidenceComplete false, proving the field says something state does not', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0003' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0003',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({
        evidencePath,
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
      });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupTranscriptPathJoin({ evidencePath, runId: 'run_2' });
      proxy.setupTranscriptLines({
        evidencePath,
        runId: 'run_2',
        lines: [JSON.stringify(StepReadingStub({ step: 7 }))],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'killed' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'killed',
          specName: 'dungeonmaster-stack',
          uptime: null,
          lastBeat: '4m',
          runs: 2,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: { run: 'run_2', step: 7, verb: 'click' },
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0003',
              linkPresent: true,
            },
            files: [],
          },
          likelyCause: null,
          evidenceComplete: false,
        }),
      );
    });

    it('EMPTY: {killed, named, run_2 transcript written but still empty} => lastStep null rather than a guess', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0006' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = EpochMsStub({ value: 1_700_001_000_000 });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0006',
      });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        pgids: [],
        lastBeatMs: EpochMsStub({ value: 1_700_000_760_000 }),
      });

      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });
      proxy.setupRunsDirPathJoin({ evidencePath });
      proxy.setupRunsDirEntries({
        evidencePath,
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
      });
      proxy.setupShutdownReasonPathJoin({ evidencePath });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupTranscriptPathJoin({ evidencePath, runId: 'run_2' });
      proxy.setupTranscriptLines({
        evidencePath,
        runId: 'run_2',
        lines: [],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: InstanceStateStub({ value: 'killed' }),
        named: true,
        nowMs,
        oomKillsSinceBoot: null,
      });

      expect(result).toStrictEqual(
        InstanceStatusStub({
          id: instanceId,
          state: 'killed',
          specName: 'dungeonmaster-stack',
          uptime: null,
          lastBeat: '4m',
          runs: 2,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0006',
              linkPresent: true,
            },
            files: [],
          },
          likelyCause: null,
          evidenceComplete: false,
        }),
      );
    });
  });
});
