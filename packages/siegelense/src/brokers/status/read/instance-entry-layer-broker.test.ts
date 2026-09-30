import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';

import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStatusStub } from '../../../contracts/instance-status/instance-status.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';

const NO_PROFILE = SpecProfileStub({ samples: [], fromRuns: 0, measuredAt: null, bootMs: null });

import { instanceEntryLayerBroker } from './instance-entry-layer-broker';
import { instanceEntryLayerBrokerProxy } from './instance-entry-layer-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = '/home/user/.dungeonmaster';
const ROOT_PATH = '/home/user/.dungeonmaster/siegelense';

describe('instanceEntryLayerBroker', () => {
  describe('an alive instance, not named', () => {
    it('VALID: {alive, unnamed, empty pgids} => uptime, lastBeat and rssMB populated; lastStep and evidence stay null', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId: null,
        specName: 'dungeonmaster-stack',
        pgids: [],
        bootedAtMs: 1_700_000_160_000,
        lastBeatMs: 1_700_000_998_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupProcListing({ pids: [] });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'alive',
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
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c22';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId: null,
        specName: 'dungeonmaster-stack',
        pgids: [ProcessGroupIdStub({ value: 4_143_212 }), ProcessGroupIdStub({ value: 4_143_213 })],
        bootedAtMs: 1_700_000_160_000,
        lastBeatMs: 1_700_000_998_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupProcListing({ pids: [] });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'alive',
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
    it('VALID: {dead, named, no runs yet} => evidence carries dir and logs with a null transcript and lastShot', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0001' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0001';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: 'dungeonmaster-stack',
        pgids: [],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupDriverLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'dead',
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
            transcript: null,
            logs: [],
            lastShot: null,
          },
          likelyCause: 'memory unavailable at last beat; kernel OOM events unavailable',
        }),
      );
    });

    it('VALID: {dead, named, driver.log present, api/web absent} => evidence.logs carries driver.log as a full repo-local path', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0005' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0005';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: 'dungeonmaster-stack',
        pgids: [],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupDriverLogPresent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'dead',
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
            transcript: null,
            logs: [
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0005/driver.log',
            ],
            lastShot: null,
          },
          likelyCause: 'memory unavailable at last beat; kernel OOM events unavailable',
        }),
      );
    });

    it('VALID: {dead, named, a recorded shutdown reason} => likelyCause is the recorded reason, and the memory/OOM text never enters it', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0004' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0004';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: 'dungeonmaster-stack',
        pgids: [],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonFound({
        evidencePath,
        marker: ShutdownReasonStub({
          reason: 'reaped by idle timeout after 900s with no run received',
        }),
      });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupDriverLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'dead',
        named: true,
        nowMs,
        oomKillsSinceBoot: 1,
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
            transcript: null,
            logs: [],
            lastShot: null,
          },
          likelyCause: 'reaped by idle timeout after 900s with no run received',
        }),
      );
    });
  });

  describe('a dead instance, named, with a completed run', () => {
    it('VALID: {dead, named, one prior run and a dying run} => last beat, last step, rssAtLastBeat and orphan pgids all populated', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0000' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000';
      const pgid = ProcessGroupIdStub({ value: 33_812 });
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: 'dungeonmaster-stack',
        pgids: [pgid],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({
        evidencePath,
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
      });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: ['100'] });
      proxy.setupPidStat({ pid: '100', pgrp: 33_812, comm: 'node' });
      proxy.setupOrphanCmdline({ pid: '100', argv: ['npm', 'run', 'dev:no-watch'] });
      proxy.setupOrphanAlive({ pgid });
      proxy.setupApiLogPresent({ evidencePath });
      proxy.setupWebLogPresent({ evidencePath });
      proxy.setupDriverLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
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
        state: 'dead',
        named: true,
        nowMs,
        oomKillsSinceBoot: 2,
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
            transcript: 'run_2.jsonl',
            logs: [
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/api-server.log',
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000/web-server.log',
            ],
            lastShot: 'run_2/step7.png',
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
      const evidencePath = '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_e3dd0006';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId: null,
        specName: 'stack',
        pgids: [],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: [] });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({
        profile: SpecProfileStub({
          specName: 'stack',
          samples: [{ poolSize: 1, steadyMB: 488, peakMB: 609, runs: 5 }],
        }),
      });
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupDriverLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'dead',
        named: true,
        nowMs: 1_700_001_000_000,
        oomKillsSinceBoot: 0,
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
            transcript: null,
            logs: [],
            lastShot: null,
          },
          likelyCause:
            'memory 609MB at last beat; profile 609MB peak / 488MB steady at pool size 1, from 5 runs; kernel OOM kills since boot: 0',
        }),
      );
    });
  });

  describe('a killed instance, named, distinguishing a clean stop from a crash mid-run', () => {
    it('VALID: {killed, named, run_1 finished cleanly} => evidenceComplete true', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0002' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0002';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: 'dungeonmaster-stack',
        pgids: [],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({ evidencePath, entries: ['run_1.jsonl', 'run_1.json'] });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupDriverLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupTranscriptLines({
        evidencePath,
        runId: 'run_1',
        lines: [JSON.stringify(StepReadingStub({ step: 3 }))],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'killed',
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
            transcript: 'run_1.jsonl',
            logs: [],
            lastShot: 'run_1/step3.png',
          },
          likelyCause: 'memory unavailable at last beat; kernel OOM events unavailable',
          evidenceComplete: true,
        }),
      );
    });

    it('VALID: {killed, named, run_2 crashed mid-step with no run_2.json} => evidenceComplete false, proving the field says something state does not', async () => {
      const proxy = instanceEntryLayerBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0003' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_001_000_000;
      const evidencePath = '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0003';
      const entry = RegistryEntryStub({
        id: instanceId,
        guildId,
        specName: 'dungeonmaster-stack',
        pgids: [],
        lastBeatMs: 1_700_000_760_000,
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
      proxy.setupRunsDirEntries({
        evidencePath,
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
      });
      proxy.setupShutdownReasonMissing({ evidencePath });
      proxy.setupProfileSolo({ profile: NO_PROFILE });
      proxy.setupProcListing({ pids: [] });
      proxy.setupApiLogAbsent({ evidencePath });
      proxy.setupWebLogAbsent({ evidencePath });
      proxy.setupDriverLogAbsent({ evidencePath });
      proxy.setupRepoLinkResolves({
        cwdPath: '/repo',
        linkPath: '/repo/.dungeonmaster-assets/siegelense-assets',
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
      });
      proxy.setupTranscriptLines({
        evidencePath,
        runId: 'run_2',
        lines: [JSON.stringify(StepReadingStub({ step: 7 }))],
      });

      const result = await instanceEntryLayerBroker({
        entry,
        state: 'killed',
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
            transcript: 'run_2.jsonl',
            logs: [],
            lastShot: 'run_2/step7.png',
          },
          likelyCause: 'memory unavailable at last beat; kernel OOM events unavailable',
          evidenceComplete: false,
        }),
      );
    });
  });
});
