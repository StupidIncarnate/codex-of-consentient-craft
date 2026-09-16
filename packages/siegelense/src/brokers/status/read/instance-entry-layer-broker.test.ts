import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../../contracts/instance-state/instance-state.stub';
import { InstanceStatusStub } from '../../../contracts/instance-status/instance-status.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';

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
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
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
          specName: 'dungeonmaster-web',
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
    it('VALID: {dead, named, no runs yet} => evidence carries dir and logs with a null transcript and lastShot', async () => {
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
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
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
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiWebLogPathJoins({ evidencePath });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.siegelense' }),
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
          specName: 'dungeonmaster-web',
          uptime: null,
          lastBeat: '4m',
          runs: 0,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0001',
              linkPresent: true,
            },
            transcript: null,
            logs: [],
            lastShot: null,
          },
          likelyCause: 'rss unavailable at last beat; kernel OOM events unavailable',
        }),
      );
    });
  });

  describe('a dead instance, named, with a completed run', () => {
    it('VALID: {dead, named, one prior run and a dying run} => last beat, last step, rssAtLastBeat and orphan pgids all populated', async () => {
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
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
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
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
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
          specName: 'dungeonmaster-web',
          uptime: null,
          lastBeat: '4m',
          runs: 2,
          rssMB: null,
          rssAtLastBeat: 2980,
          lastStep: { run: 'run_2', step: 7, verb: 'click' },
          orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
          evidence: {
            dir: {
              path: '/repo/.siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000',
              linkPresent: true,
            },
            transcript: 'run_2.jsonl',
            logs: ['api-server.log', 'web-server.log'],
            lastShot: 'run_2/step7.png',
          },
          likelyCause:
            'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM kills since boot: 2',
          evidenceComplete: false,
        }),
      );
    });
  });

  describe('a killed instance, named, distinguishing a clean stop from a crash mid-run', () => {
    it('VALID: {killed, named, run_1 finished cleanly} => evidenceComplete true', async () => {
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
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
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
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiWebLogPathJoins({ evidencePath });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.siegelense' }),
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
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
          specName: 'dungeonmaster-web',
          uptime: null,
          lastBeat: '4m',
          runs: 1,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: { run: 'run_1', step: 3, verb: 'click' },
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002',
              linkPresent: true,
            },
            transcript: 'run_1.jsonl',
            logs: [],
            lastShot: 'run_1/step3.png',
          },
          likelyCause: 'rss unavailable at last beat; kernel OOM events unavailable',
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
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
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
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiWebLogPathJoins({ evidencePath });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.siegelense' }),
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
          specName: 'dungeonmaster-web',
          uptime: null,
          lastBeat: '4m',
          runs: 2,
          rssMB: null,
          rssAtLastBeat: null,
          lastStep: { run: 'run_2', step: 7, verb: 'click' },
          orphans: [],
          evidence: {
            dir: {
              path: '/repo/.siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0003',
              linkPresent: true,
            },
            transcript: 'run_2.jsonl',
            logs: [],
            lastShot: 'run_2/step7.png',
          },
          likelyCause: 'rss unavailable at last beat; kernel OOM events unavailable',
          evidenceComplete: false,
        }),
      );
    });
  });
});
