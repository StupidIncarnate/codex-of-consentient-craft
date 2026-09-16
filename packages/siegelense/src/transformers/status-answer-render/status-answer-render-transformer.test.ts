import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceStatusStub } from '../../contracts/instance-status/instance-status.stub';
import { StatusAnswerStub } from '../../contracts/status-answer/status-answer.stub';

import { statusAnswerRenderTransformer } from './status-answer-render-transformer';

describe('statusAnswerRenderTransformer', () => {
  describe('no instances, no instance named', () => {
    it('EMPTY: {instanceId: null, instances: []} => the plain fleet-empty sentence, never an error', () => {
      const answer = StatusAnswerStub({ instances: [] });

      const result = statusAnswerRenderTransformer({ answer, instanceId: null });

      expect(result).toBe('No siegelense instances running.\n');
    });
  });

  describe('no instances, an instance named', () => {
    it('EMPTY: {instanceId: inst_deadbeef, instances: []} => a sentence naming that id as unknown, distinguishable from the fleet-empty sentence', () => {
      const answer = StatusAnswerStub({ instances: [] });
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe('No instance by the id "inst_deadbeef" — unknown, never existed.\n');
    });
  });

  describe('a fleet listing of one instance', () => {
    it('VALID: {one alive instance, machine readings absent} => the fleet form, never the named form', () => {
      const answer = StatusAnswerStub({
        machine: {
          freeMemMB: 980,
          totalMemMB: 16_000,
          freeDiskMB: null,
          cores: 8,
          loadAvg: [7.9, 6.2, 4.1],
          oomKillsSinceBoot: null,
          lastOomAt: null,
        },
        instances: [
          InstanceStatusStub({
            id: 'inst_7f3a',
            state: 'alive',
            specName: 'dungeonmaster-web',
            uptime: '14m',
            lastBeat: '2s ago',
            runs: 3,
            rssMB: 1840,
            rssAtLastBeat: null,
            lastStep: null,
            orphans: [],
            evidence: null,
            likelyCause: null,
          }),
        ],
      });

      const result = statusAnswerRenderTransformer({ answer, instanceId: null });

      expect(result).toBe(
        'MONITORED: rss per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk -MB, 8 cores, load 7.9/6.2/4.1, OOM kills - (last -)\n' +
          'ID\tSTATE\tSPEC\tUPTIME\tLAST BEAT\tRUNS\tRSS\tORPHANS\n' +
          'inst_7f3a\talive\tdungeonmaster-web\t14m\t2s ago\t3\t1840MB\t0\n',
      );
    });
  });

  describe('a fleet listing of two instances', () => {
    it('VALID: {a live and a dead instance} => the machine block, the monitored list, and one line per instance', () => {
      const answer = StatusAnswerStub({
        machine: {
          freeMemMB: 980,
          totalMemMB: 16_000,
          freeDiskMB: 2100,
          cores: 8,
          loadAvg: [7.9, 6.2, 4.1],
          oomKillsSinceBoot: 2,
          lastOomAt: '20:11:04',
        },
        instances: [
          InstanceStatusStub({
            id: 'inst_7f3a',
            state: 'alive',
            specName: 'dungeonmaster-web',
            uptime: '14m',
            lastBeat: '2s ago',
            runs: 3,
            rssMB: 1840,
            rssAtLastBeat: null,
            lastStep: null,
            orphans: [],
            evidence: null,
            likelyCause: null,
          }),
          InstanceStatusStub({
            id: 'inst_9b2c',
            state: 'dead',
            specName: 'dungeonmaster-headless',
            uptime: null,
            lastBeat: '9h ago',
            runs: 5,
            rssMB: null,
            rssAtLastBeat: 1200,
            lastStep: null,
            orphans: [{ pgid: 33_812, cmd: null, alive: true }],
            evidence: null,
            likelyCause: null,
          }),
        ],
      });

      const result = statusAnswerRenderTransformer({ answer, instanceId: null });

      expect(result).toBe(
        'MONITORED: rss per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2 (last 20:11:04)\n' +
          'ID\tSTATE\tSPEC\tUPTIME\tLAST BEAT\tRUNS\tRSS\tORPHANS\n' +
          'inst_7f3a\talive\tdungeonmaster-web\t14m\t2s ago\t3\t1840MB\t0\n' +
          'inst_9b2c\tdead\tdungeonmaster-headless\t-\t9h ago\t5\t1200MB\t1\n',
      );
    });
  });

  describe('a named dead instance', () => {
    it('VALID: {orphans, evidence and likelyCause all present} => the full single-instance form', () => {
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: 'inst_9b2c',
            state: 'dead',
            specName: 'dungeonmaster-web',
            uptime: null,
            lastBeat: '9h ago',
            runs: 3,
            rssMB: null,
            rssAtLastBeat: 1840,
            lastStep: { run: 'run_2', step: 7, verb: 'click' },
            orphans: [
              { pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true },
              { pgid: 33_840, cmd: null, alive: false },
            ],
            evidence: {
              dir: { path: '/repo/.siegelense/guilds/g1/instances/inst_9b2c', linkPresent: true },
              transcript: 'run_2.jsonl',
              logs: ['api-server.log', 'web-server.log'],
              lastShot: 'run_2/step7.png',
            },
            likelyCause:
              'OOM killed — rss climbed to 1840MB before the last beat, 2 kernel OOM events since boot',
          }),
        ],
      });
      const instanceId = InstanceIdStub({ value: 'inst_9b2c' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe(
        'INSTANCE inst_9b2c — dead\n' +
          'SPEC: dungeonmaster-web\n' +
          'UPTIME: -\n' +
          'LAST BEAT: 9h ago\n' +
          'RUNS: 3\n' +
          'RSS: at last beat 1840MB\n' +
          'LAST STEP: run_2 step 7 click\n' +
          'ORPHANS: pgid 33812 (alive), pgid 33840 (dead)\n' +
          'EVIDENCE DIR: /repo/.siegelense/guilds/g1/instances/inst_9b2c\n' +
          'TRANSCRIPT: run_2.jsonl\n' +
          'LOGS: api-server.log, web-server.log\n' +
          'LAST SHOT: run_2/step7.png\n' +
          'LIKELY CAUSE: OOM killed — rss climbed to 1840MB before the last beat, 2 kernel OOM events since boot\n',
      );
    });
  });

  describe('a named alive instance', () => {
    it('VALID: {no orphans, no runs yet, likelyCause unknown} => "-" and "none" fill every absent field', () => {
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: 'inst_7f3a',
            state: 'alive',
            specName: 'dungeonmaster-web',
            uptime: '14m',
            lastBeat: '2s ago',
            runs: 0,
            rssMB: 512,
            rssAtLastBeat: null,
            lastStep: null,
            orphans: [],
            evidence: {
              dir: { path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a', linkPresent: true },
              transcript: null,
              logs: [],
              lastShot: null,
            },
            likelyCause: null,
          }),
        ],
      });
      const instanceId = InstanceIdStub({ value: 'inst_7f3a' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe(
        'INSTANCE inst_7f3a — alive\n' +
          'SPEC: dungeonmaster-web\n' +
          'UPTIME: 14m\n' +
          'LAST BEAT: 2s ago\n' +
          'RUNS: 0\n' +
          'RSS: 512MB\n' +
          'LAST STEP: -\n' +
          'ORPHANS: none\n' +
          'EVIDENCE DIR: /repo/.siegelense/guilds/g1/instances/inst_7f3a\n' +
          'TRANSCRIPT: -\n' +
          'LOGS: none\n' +
          'LAST SHOT: -\n' +
          'LIKELY CAUSE: -\n',
      );
    });
  });
});
