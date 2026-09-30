import { instanceStatusContract } from './instance-status-contract';
import { InstanceStatusStub } from './instance-status.stub';

describe('instanceStatusContract', () => {
  describe('valid rows', () => {
    it('VALID: {state: "alive"} => a live instance carries uptime, lastBeat and live memory, and nothing else', () => {
      const status = InstanceStatusStub({
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
        lastRunSaved: true,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
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
        branch: null,
        lastRunSaved: true,
      });
    });

    it('VALID: {state: "dead"} => a status { instance } answer carries last beat, last step, memory at last beat, orphans, evidence and likelyCause', () => {
      const status = InstanceStatusStub({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        memory: { megabytes: 2980, measured: 'at-last-beat' },
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
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
          ],
        },
        likelyCause:
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        lastRunSaved: true,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        memory: { megabytes: 2980, measured: 'at-last-beat' },
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
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
          ],
        },
        likelyCause:
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        branch: null,
        lastRunSaved: true,
      });
    });

    it('VALID: {state: "dead", from a status {} fleet listing} => lastStep and evidence stay null even though the instance is dead', () => {
      const status = InstanceStatusStub({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        memory: { megabytes: 2980, measured: 'at-last-beat' },
        lastStep: null,
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
        evidence: null,
        likelyCause:
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        lastRunSaved: true,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        memory: { megabytes: 2980, measured: 'at-last-beat' },
        lastStep: null,
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
        evidence: null,
        likelyCause:
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        branch: null,
        lastRunSaved: true,
      });
    });

    it('VALID: {state: "killed", lastRunSaved: false} => lastRunSaved carries the crash signal even though state alone reads the same as a clean kill', () => {
      const status = InstanceStatusStub({
        id: 'inst_9b2c',
        state: 'killed',
        runs: 2,
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        lastRunSaved: false,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        state: 'killed',
        specName: 'dungeonmaster-stack',
        uptime: '14m',
        lastBeat: '2s ago',
        runs: 2,
        memory: { megabytes: 1840, measured: 'live' },
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        orphans: [],
        evidence: null,
        likelyCause: null,
        branch: null,
        lastRunSaved: false,
      });
    });
  });

  describe('a row with no run yet', () => {
    it('EMPTY: {runs: 0, lastRunSaved: null} => null says there is no latest run to have saved, never "saved"', () => {
      const result = instanceStatusContract.parse(
        InstanceStatusStub({
          id: 'inst_e67b',
          state: 'killed',
          runs: 0,
          memory: null,
          lastRunSaved: null,
        }),
      );

      expect(result).toStrictEqual({
        id: 'inst_e67b',
        state: 'killed',
        specName: 'dungeonmaster-stack',
        uptime: '14m',
        lastBeat: '2s ago',
        runs: 0,
        memory: null,
        lastStep: null,
        orphans: [],
        evidence: null,
        likelyCause: null,
        branch: null,
        lastRunSaved: null,
      });
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {missing runs} => throws Required', () => {
      expect(() =>
        instanceStatusContract.parse({
          id: 'inst_7f3a',
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '14m',
          lastBeat: '2s ago',
          memory: { megabytes: 1840, measured: 'live' },
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: null,
          lastRunSaved: true,
        }),
      ).toThrow(/received undefined/u);
    });

    it('INVALID: {missing memory} => throws Required, because .nullable() is not .optional()', () => {
      expect(() =>
        instanceStatusContract.parse({
          id: 'inst_7f3a',
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '14m',
          lastBeat: '2s ago',
          runs: 3,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: null,
          lastRunSaved: true,
        }),
      ).toThrow(/received undefined/u);
    });

    it('INVALID: {missing lastRunSaved} => throws Required', () => {
      expect(() =>
        instanceStatusContract.parse({
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
          branch: null,
        }),
      ).toThrow(/received undefined/u);
    });

    it('INVALID: {state: "starting"} => throws for an unlisted InstanceState', () => {
      expect(() =>
        instanceStatusContract.parse({
          id: 'inst_7f3a',
          state: 'starting',
          specName: 'dungeonmaster-stack',
          uptime: '14m',
          lastBeat: '2s ago',
          runs: 3,
          memory: { megabytes: 1840, measured: 'live' },
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: null,
          lastRunSaved: true,
        }),
      ).toThrow(/Invalid option/u);
    });
  });
});
