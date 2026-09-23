import { instanceStatusContract } from './instance-status-contract';
import { InstanceStatusStub } from './instance-status.stub';

describe('instanceStatusContract', () => {
  describe('valid rows', () => {
    it('VALID: {state: "alive"} => a live instance carries uptime, lastBeat and rssMB, and nothing else', () => {
      const status = InstanceStatusStub({
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
        evidenceComplete: true,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
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
        branch: null,
        evidenceComplete: true,
      });
    });

    it('VALID: {state: "dead"} => a status { instance } answer carries last beat, last step, rssAtLastBeat, orphans, evidence and likelyCause', () => {
      const status = InstanceStatusStub({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        rssMB: null,
        rssAtLastBeat: 2980,
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
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
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        evidenceComplete: true,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        rssMB: null,
        rssAtLastBeat: 2980,
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
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
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        branch: null,
        evidenceComplete: true,
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
        rssMB: null,
        rssAtLastBeat: 2980,
        lastStep: null,
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
        evidence: null,
        likelyCause:
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        evidenceComplete: true,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        state: 'dead',
        specName: 'dungeonmaster-stack',
        uptime: null,
        lastBeat: '20:11:02',
        runs: 2,
        rssMB: null,
        rssAtLastBeat: 2980,
        lastStep: null,
        orphans: [{ pgid: 33_812, cmd: 'npm run dev:no-watch', alive: true }],
        evidence: null,
        likelyCause:
          'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
        branch: null,
        evidenceComplete: true,
      });
    });

    it('VALID: {state: "killed", evidenceComplete: false} => evidenceComplete carries the crash signal even though state alone reads the same as a clean kill', () => {
      const status = InstanceStatusStub({
        id: 'inst_9b2c',
        state: 'killed',
        runs: 2,
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        evidenceComplete: false,
      });

      const result = instanceStatusContract.parse(status);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        state: 'killed',
        specName: 'dungeonmaster-stack',
        uptime: '14m',
        lastBeat: '2s ago',
        runs: 2,
        rssMB: 1840,
        rssAtLastBeat: null,
        lastStep: { run: 'run_2', step: 7, verb: 'click' },
        orphans: [],
        evidence: null,
        likelyCause: null,
        branch: null,
        evidenceComplete: false,
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
          rssMB: 1840,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: null,
          evidenceComplete: true,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing rssAtLastBeat} => throws Required, because .nullable() is not .optional()', () => {
      expect(() =>
        instanceStatusContract.parse({
          id: 'inst_7f3a',
          state: 'alive',
          specName: 'dungeonmaster-stack',
          uptime: '14m',
          lastBeat: '2s ago',
          runs: 3,
          rssMB: 1840,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: null,
          evidenceComplete: true,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing evidenceComplete} => throws Required', () => {
      expect(() =>
        instanceStatusContract.parse({
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
          branch: null,
        }),
      ).toThrow(/Required/u);
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
          rssMB: 1840,
          rssAtLastBeat: null,
          lastStep: null,
          orphans: [],
          evidence: null,
          likelyCause: null,
          branch: null,
          evidenceComplete: true,
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
