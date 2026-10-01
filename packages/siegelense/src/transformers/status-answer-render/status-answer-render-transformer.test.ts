import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceStatusStub } from '../../contracts/instance-status/instance-status.stub';
import { StatusAnswerStub } from '../../contracts/status-answer/status-answer.stub';

import { statusAnswerRenderTransformer } from './status-answer-render-transformer';

describe('statusAnswerRenderTransformer', () => {
  describe('no instances, no instance named', () => {
    it('EMPTY: {branch: null, since: 6h, instances: []} => names the since window, keeps MONITORED/MACHINE, and suggests widening --since', () => {
      const answer = StatusAnswerStub({ instances: [] });

      const result = statusAnswerRenderTransformer({
        answer,
        instanceId: null,
        branch: null,
        since: '6h',
      });

      expect(result).toBe(
        'MONITORED: memory per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2\n' +
          'No siegelense instances created in the last 6hr. Widen with --since 1wk.\n',
      );
    });

    it('EMPTY: {branch: "main", since: 6h, instances: []} => names the branch AND the since window together', () => {
      const answer = StatusAnswerStub({ instances: [] });

      const result = statusAnswerRenderTransformer({
        answer,
        instanceId: null,
        branch: 'main',
        since: '6h',
      });

      expect(result).toBe(
        'MONITORED: memory per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2\n' +
          'No siegelense instances created on branch "main" in the last 6hr. Widen with --since 1wk.\n',
      );
    });

    it('EMPTY: {branch: "main", since: 1wk, instances: []} => already the widest window, suggests dropping --branch instead', () => {
      const answer = StatusAnswerStub({ instances: [] });

      const result = statusAnswerRenderTransformer({
        answer,
        instanceId: null,
        branch: 'main',
        since: '1wk',
      });

      expect(result).toBe(
        'MONITORED: memory per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2\n' +
          'No siegelense instances created on branch "main" in the last 1wk. Widen by dropping --branch.\n',
      );
    });

    it('EMPTY: {branch: null, since: 1wk, instances: []} => the widest window already, and no branch to drop => no widen clause', () => {
      const answer = StatusAnswerStub({ instances: [] });

      const result = statusAnswerRenderTransformer({
        answer,
        instanceId: null,
        branch: null,
        since: '1wk',
      });

      expect(result).toBe(
        'MONITORED: memory per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2\n' +
          'No siegelense instances created in the last 1wk.\n',
      );
    });
  });

  describe('no instances, an instance named', () => {
    it('EMPTY: {instanceId: inst_deadbeef, instances: []} => a sentence saying siegelense has no record of the id, distinguishable from the fleet-empty sentence', () => {
      const answer = StatusAnswerStub({ instances: [] });
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe(
        'No record of the instance id "inst_deadbeef". Check the id that `dungeonmaster siegelense start` returned.\n',
      );
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
        },
        instances: [
          InstanceStatusStub({
            id: 'inst_7f3a',
            state: 'alive',
            specName: 'dungeonmaster-stack',
            uptime: '14m',
            lastBeat: '2s ago',
            runs: 3,
            memory: { megabytes: 1840, measured: 'live' },
            lastStep: null,
            orphans: [],
            evidence: null,
            likelyCause: null,
          }),
        ],
      });

      const result = statusAnswerRenderTransformer({ answer, instanceId: null });

      expect(result).toBe(
        'MONITORED: memory per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk -MB, 8 cores, load 7.9/6.2/4.1, OOM kills unreadable\n' +
          '┌───────────┬───────┬─────────────────────┬────────┬────────┬───────────┬──────┬────────┬─────────┐\n' +
          '│ ID        │ STATE │ SPEC                │ BRANCH │ UPTIME │ LAST BEAT │ RUNS │ MEMORY │ ORPHANS │\n' +
          '├───────────┼───────┼─────────────────────┼────────┼────────┼───────────┼──────┼────────┼─────────┤\n' +
          '│ inst_7f3a │ alive │ dungeonmaster-stack │ -      │ 14m    │ 2s ago    │ 3    │ 1840MB │ 0       │\n' +
          '└───────────┴───────┴─────────────────────┴────────┴────────┴───────────┴──────┴────────┴─────────┘\n',
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
        },
        instances: [
          InstanceStatusStub({
            id: 'inst_7f3a',
            state: 'alive',
            specName: 'dungeonmaster-stack',
            uptime: '14m',
            lastBeat: '2s ago',
            runs: 3,
            memory: { megabytes: 1840, measured: 'live' },
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
            memory: { megabytes: 1200, measured: 'at-last-beat' },
            lastStep: null,
            orphans: [{ pgid: 33_812, cmd: null, alive: true }],
            evidence: null,
            likelyCause: null,
          }),
        ],
      });

      const result = statusAnswerRenderTransformer({ answer, instanceId: null });

      expect(result).toBe(
        'MONITORED: memory per process group, free memory, free disk, load average, kernel OOM events\n' +
          'MACHINE: free 980MB/16000MB mem, free disk 2100MB, 8 cores, load 7.9/6.2/4.1, OOM kills 2\n' +
          '┌───────────┬───────┬─────────────────────┬────────┬────────┬───────────┬──────┬────────┬─────────┐\n' +
          '│ ID        │ STATE │ SPEC                │ BRANCH │ UPTIME │ LAST BEAT │ RUNS │ MEMORY │ ORPHANS │\n' +
          '├───────────┼───────┼─────────────────────┼────────┼────────┼───────────┼──────┼────────┼─────────┤\n' +
          '│ inst_7f3a │ alive │ dungeonmaster-stack │ -      │ 14m    │ 2s ago    │ 3    │ 1840MB │ 0       │\n' +
          '│ inst_9b2c │ dead  │ dungeonmaster-api   │ -      │ -      │ 9h ago    │ 5    │ 1200MB │ 1       │\n' +
          '└───────────┴───────┴─────────────────────┴────────┴────────┴───────────┴──────┴────────┴─────────┘\n',
      );
    });
  });

  describe('a named dead instance', () => {
    it("VALID: {orphans, evidence and likelyCause all present} => the full single-instance form, with every evidence file (both runs' shots and the video) in a tree under EVIDENCE DIR", () => {
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: 'inst_9b2c',
            state: 'dead',
            specName: 'dungeonmaster-stack',
            uptime: null,
            lastBeat: '9h ago',
            runs: 3,
            memory: { megabytes: 1840, measured: 'at-last-beat' },
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
              files: [
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/api-server.log',
                  bytes: 2048,
                },
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/runs/run_1/step1.png',
                  bytes: 50000,
                },
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/runs/run_2/step7.png',
                  bytes: 51000,
                },
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/video/703547507e7caf9bcbc8328daae3e4d1.webm',
                  bytes: 860132,
                },
              ],
            },
            likelyCause:
              'OOM killed — rss climbed to 1840MB before the last beat, 2 kernel OOM events since boot',
          }),
        ],
      });
      const instanceId = InstanceIdStub({ value: 'inst_9b2c' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe(
        '┌──────────────┬─────────────────────────────────────────────────────────────────────────────────────────┐\n' +
          '│ FIELD        │ VALUE                                                                                   │\n' +
          '├──────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤\n' +
          '│ INSTANCE     │ inst_9b2c — dead                                                                        │\n' +
          '│ SPEC         │ dungeonmaster-stack                                                                     │\n' +
          '│ UPTIME       │ -                                                                                       │\n' +
          '│ LAST BEAT    │ 9h ago                                                                                  │\n' +
          '│ RUNS         │ 3                                                                                       │\n' +
          '│ MEMORY       │ at last beat 1840MB                                                                     │\n' +
          '│ LAST STEP    │ run_2 step 7 click                                                                      │\n' +
          '│ ORPHANS      │ pgid 33812 (alive)                                                                      │\n' +
          '│              │ pgid 33840 (dead)                                                                       │\n' +
          '│ EVIDENCE DIR │ /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c             │\n' +
          '│              │ api-server.log (2048 bytes)                                                             │\n' +
          '│              │ runs/                                                                                   │\n' +
          '│              │   run_1/                                                                                │\n' +
          '│              │     step1.png (50000 bytes)                                                             │\n' +
          '│              │   run_2/                                                                                │\n' +
          '│              │     step7.png (51000 bytes)                                                             │\n' +
          '│              │ video/                                                                                  │\n' +
          '│              │   703547507e7caf9bcbc8328daae3e4d1.webm (860132 bytes)                                  │\n' +
          '│ LIKELY CAUSE │ OOM killed — rss climbed to 1840MB before the last beat, 2 kernel OOM events since boot │\n' +
          '└──────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘\n',
      );
    });
  });

  describe('a named dead instance with several logs and orphans', () => {
    it('VALID: {3 evidence files, 2 orphans} => each file and each orphan gets its own row, so EVIDENCE DIR alone sets the table width', () => {
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: 'inst_e3dd',
            state: 'dead',
            specName: 'stack',
            uptime: null,
            lastBeat: '9h ago',
            runs: 1,
            memory: { megabytes: 609, measured: 'at-last-beat' },
            lastStep: null,
            orphans: [
              { pgid: 33_812, cmd: null, alive: false },
              { pgid: 33_840, cmd: null, alive: false },
            ],
            evidence: {
              dir: {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e3dd',
                linkPresent: true,
              },
              files: [
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e3dd/api-server.log',
                  bytes: 10,
                },
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e3dd/driver.log',
                  bytes: 30,
                },
                {
                  path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e3dd/web-server.log',
                  bytes: 20,
                },
              ],
            },
            likelyCause: null,
          }),
        ],
      });
      const instanceId = InstanceIdStub({ value: 'inst_e3dd' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe(
        '┌──────────────┬───────────────────────────────────────────────────────────────────────────┐\n' +
          '│ FIELD        │ VALUE                                                                     │\n' +
          '├──────────────┼───────────────────────────────────────────────────────────────────────────┤\n' +
          '│ INSTANCE     │ inst_e3dd — dead                                                          │\n' +
          '│ SPEC         │ stack                                                                     │\n' +
          '│ UPTIME       │ -                                                                         │\n' +
          '│ LAST BEAT    │ 9h ago                                                                    │\n' +
          '│ RUNS         │ 1                                                                         │\n' +
          '│ MEMORY       │ at last beat 609MB                                                        │\n' +
          '│ LAST STEP    │ -                                                                         │\n' +
          '│ ORPHANS      │ pgid 33812 (dead)                                                         │\n' +
          '│              │ pgid 33840 (dead)                                                         │\n' +
          '│ EVIDENCE DIR │ /repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e3dd │\n' +
          '│              │ api-server.log (10 bytes)                                                 │\n' +
          '│              │ driver.log (30 bytes)                                                     │\n' +
          '│              │ web-server.log (20 bytes)                                                 │\n' +
          '│ LIKELY CAUSE │ -                                                                         │\n' +
          '└──────────────┴───────────────────────────────────────────────────────────────────────────┘\n',
      );

      // The defect this guards: several evidence paths joined onto ONE row with commas pushed a real
      // terminal table to roughly 500 characters wide. With one row per item, every line in the
      // rendered table stays no wider than the longest single cell (EVIDENCE DIR here).
      const widestLine = Math.max(...result.split('\n').map((line) => line.length));

      expect(widestLine).toBe(92);
    });
  });

  describe('a named alive instance', () => {
    it('VALID: {no orphans, no runs yet, no evidence files, likelyCause unknown} => "-", "none" and "no files" fill every absent field', () => {
      const answer = StatusAnswerStub({
        instances: [
          InstanceStatusStub({
            id: 'inst_7f3a',
            state: 'alive',
            specName: 'dungeonmaster-stack',
            uptime: '14m',
            lastBeat: '2s ago',
            runs: 0,
            memory: { megabytes: 512, measured: 'live' },
            lastStep: null,
            orphans: [],
            evidence: {
              dir: {
                path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a',
                linkPresent: true,
              },
              files: [],
            },
            likelyCause: null,
          }),
        ],
      });
      const instanceId = InstanceIdStub({ value: 'inst_7f3a' });

      const result = statusAnswerRenderTransformer({ answer, instanceId });

      expect(result).toBe(
        '┌──────────────┬─────────────────────────────────────────────────────────────────────────────┐\n' +
          '│ FIELD        │ VALUE                                                                       │\n' +
          '├──────────────┼─────────────────────────────────────────────────────────────────────────────┤\n' +
          '│ INSTANCE     │ inst_7f3a — alive                                                           │\n' +
          '│ SPEC         │ dungeonmaster-stack                                                         │\n' +
          '│ UPTIME       │ 14m                                                                         │\n' +
          '│ LAST BEAT    │ 2s ago                                                                      │\n' +
          '│ RUNS         │ 0                                                                           │\n' +
          '│ MEMORY       │ 512MB                                                                       │\n' +
          '│ LAST STEP    │ -                                                                           │\n' +
          '│ ORPHANS      │ none                                                                        │\n' +
          '│ EVIDENCE DIR │ /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a │\n' +
          '│              │ no files                                                                    │\n' +
          '│ LIKELY CAUSE │ -                                                                           │\n' +
          '└──────────────┴─────────────────────────────────────────────────────────────────────────────┘\n',
      );
    });
  });
});
