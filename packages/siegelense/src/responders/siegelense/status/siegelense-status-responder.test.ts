import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStatusStub } from '../../../contracts/instance-status/instance-status.stub';
import { StatusAnswerStub } from '../../../contracts/status-answer/status-answer.stub';

import { SiegelenseStatusResponder } from './siegelense-status-responder';
import { SiegelenseStatusResponderProxy } from './siegelense-status-responder.proxy';

describe('SiegelenseStatusResponder', () => {
  describe('no instance named, empty fleet', () => {
    it('EMPTY: {instanceId: null, isJson: true, no instances} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('EMPTY: {instanceId: null, isJson: false, no instances} => writes the plain fleet-empty sentence', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null, isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual(['No siegelense instances running.\n']);
    });

    it('EMPTY: {instanceId: null, isJson omitted, no instances} => writes the plain fleet-empty sentence by default', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId: null });

      expect(proxy.getStdoutWrites()).toStrictEqual(['No siegelense instances running.\n']);
    });
  });

  describe('an instance named, that id not in the registry', () => {
    it('EMPTY: {instanceId: inst_deadbeef, isJson: true, no instances} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('EMPTY: {instanceId: inst_deadbeef, isJson: false, no instances} => writes a sentence naming that id, distinct from the fleet-empty sentence', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const answer = StatusAnswerStub({ instances: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseStatusResponder({ instanceId, isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'No instance by the id "inst_deadbeef" — unknown, never existed.\n',
      ]);
    });
  });

  describe('no instance named, a live and a dead instance', () => {
    it('VALID: {instanceId: null, isJson: true} => writes the StatusAnswer as one JSON document', async () => {
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
            specName: 'dungeonmaster-stack',
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
            specName: 'dungeonmaster-api',
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

      await SiegelenseStatusResponder({ instanceId: null, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {instanceId: null, isJson: false} => writes the machine block, the monitored list, and one line per instance', async () => {
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
            specName: 'dungeonmaster-stack',
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
            specName: 'dungeonmaster-api',
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

      await SiegelenseStatusResponder({ instanceId: null, isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'MONITORED: rss per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2 (last 20:11:04)\n' +
          '┌───────────┬───────┬─────────────────────┬────────┬────────┬───────────┬──────┬────────┬─────────┐\n' +
          '│ ID        │ STATE │ SPEC                │ BRANCH │ UPTIME │ LAST BEAT │ RUNS │ RSS    │ ORPHANS │\n' +
          '├───────────┼───────┼─────────────────────┼────────┼────────┼───────────┼──────┼────────┼─────────┤\n' +
          '│ inst_7f3a │ alive │ dungeonmaster-stack │ -      │ 14m    │ 2s ago    │ 3    │ 1840MB │ 0       │\n' +
          '│ inst_9b2c │ dead  │ dungeonmaster-api   │ -      │ -      │ 9h ago    │ 5    │ 1200MB │ 1       │\n' +
          '└───────────┴───────┴─────────────────────┴────────┴────────┴───────────┴──────┴────────┴─────────┘\n',
      ]);
    });
  });

  describe('a named dead instance', () => {
    it('VALID: {instanceId: inst_9b2c, isJson: true} => writes the StatusAnswer as one JSON document', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c' });
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: instanceId,
            state: 'dead',
            specName: 'dungeonmaster-stack',
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
              dir: {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
                linkPresent: true,
              },
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

      await SiegelenseStatusResponder({ instanceId, isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {instanceId: inst_9b2c, isJson: false} => writes that instance in full', async () => {
      const proxy = SiegelenseStatusResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c' });
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: instanceId,
            state: 'dead',
            specName: 'dungeonmaster-stack',
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
              dir: {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
                linkPresent: true,
              },
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

      await SiegelenseStatusResponder({ instanceId, isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'INSTANCE inst_9b2c — dead\n' +
          'SPEC: dungeonmaster-stack\n' +
          'UPTIME: -\n' +
          'LAST BEAT: 9h ago\n' +
          'RUNS: 3\n' +
          'RSS: at last beat 1840MB\n' +
          'LAST STEP: run_2 step 7 click\n' +
          'ORPHANS: pgid 33812 (alive), pgid 33840 (dead)\n' +
          'EVIDENCE DIR: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c\n' +
          'TRANSCRIPT: run_2.jsonl\n' +
          'LOGS: api-server.log, web-server.log\n' +
          'LAST SHOT: run_2/step7.png\n' +
          'LIKELY CAUSE: OOM killed — rss climbed to 1840MB before the last beat, 2 kernel OOM events since boot\n',
      ]);
    });
  });
});
