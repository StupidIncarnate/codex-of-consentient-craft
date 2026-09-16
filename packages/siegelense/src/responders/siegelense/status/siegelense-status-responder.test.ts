import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStatusStub } from '../../../contracts/instance-status/instance-status.stub';
import { StatusAnswerStub } from '../../../contracts/status-answer/status-answer.stub';

import { SiegelenseStatusResponder } from './siegelense-status-responder';
import { SiegelenseStatusResponderProxy } from './siegelense-status-responder.proxy';

describe('SiegelenseStatusResponder', () => {
  describe('no instance named, empty fleet', () => {
    it('EMPTY: {instanceId: null, human: false, no instances} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null, human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('EMPTY: {instanceId: null, human: true, no instances} => writes the plain fleet-empty sentence', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null, human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual(['No siegelense instances running.\n']);
    });
  });

  describe('an instance named, that id not in the registry', () => {
    it('EMPTY: {instanceId: inst_deadbeef, human: false, no instances} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId, human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('EMPTY: {instanceId: inst_deadbeef, human: true, no instances} => writes a sentence naming that id, distinct from the fleet-empty sentence', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId, human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'No instance by the id "inst_deadbeef" — unknown, never existed.\n',
      ]);
    });
  });

  describe('no instance named, a live and a dead instance', () => {
    it('VALID: {instanceId: null, human: false} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
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
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null, human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {instanceId: null, human: true} => writes the machine block, the monitored list, and one line per instance', async () => {
      const proxy = SiegelenseStatusResponderProxy();
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
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null, human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'MONITORED: rss per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2 (last 20:11:04)\n' +
          'ID\tSTATE\tSPEC\tUPTIME\tLAST BEAT\tRUNS\tRSS\tORPHANS\n' +
          'inst_7f3a\talive\tdungeonmaster-web\t14m\t2s ago\t3\t1840MB\t0\n' +
          'inst_9b2c\tdead\tdungeonmaster-headless\t-\t9h ago\t5\t1200MB\t1\n',
      ]);
    });
  });

  describe('a named dead instance', () => {
    it('VALID: {instanceId: inst_9b2c, human: false} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c' });
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: instanceId,
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
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId, human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {instanceId: inst_9b2c, human: true} => writes that instance in full', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c' });
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: instanceId,
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
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId, human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
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
      ]);
    });
  });
});
