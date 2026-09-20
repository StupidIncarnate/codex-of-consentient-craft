import { statusAnswerContract } from './status-answer-contract';
import { StatusAnswerStub } from './status-answer.stub';

describe('statusAnswerContract', () => {
  describe('valid answers', () => {
    it('EMPTY: {instances: []} => a fleet with nothing running still parses', () => {
      const answer = StatusAnswerStub({ instances: [] });

      const result = statusAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        monitored: [
          'rss per process group',
          'free memory',
          'free disk',
          'load average',
          'kernel OOM events',
        ],
        machine: {
          freeMemMB: 980,
          totalMemMB: 16_000,
          freeDiskMB: 2100,
          cores: 8,
          loadAvg: [7.9, 6.2, 4.1],
          oomKillsSinceBoot: 2,
          lastOomAt: '20:11:04',
        },
        instances: [],
        queriedInstanceState: null,
      });
    });

    it("VALID: {queriedInstanceState: 'unknown'} => a named query that resolved nothing still parses", () => {
      const answer = StatusAnswerStub({ instances: [], queriedInstanceState: 'unknown' });

      const result = statusAnswerContract.parse(answer);

      expect(result.queriedInstanceState).toBe('unknown');
    });

    it('VALID: {instances: [one alive row]} => parses one fleet entry', () => {
      const answer = StatusAnswerStub({
        instances: [
          {
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
          },
        ],
      });

      const result = statusAnswerContract.parse(answer);

      expect(result.instances).toStrictEqual([
        {
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
        },
      ]);
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {monitored: ["cpu usage"]} => throws for an unlisted metric name', () => {
      expect(() =>
        statusAnswerContract.parse({
          monitored: ['cpu usage'],
          machine: {
            freeMemMB: 980,
            totalMemMB: 16_000,
            freeDiskMB: 2100,
            cores: 8,
            loadAvg: [7.9, 6.2, 4.1],
            oomKillsSinceBoot: 2,
            lastOomAt: '20:11:04',
          },
          instances: [],
          queriedInstanceState: null,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing machine} => throws Required', () => {
      expect(() =>
        statusAnswerContract.parse({
          monitored: [],
          instances: [],
          queriedInstanceState: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing queriedInstanceState} => throws Required', () => {
      expect(() =>
        statusAnswerContract.parse({
          monitored: [],
          machine: {
            freeMemMB: 980,
            totalMemMB: 16_000,
            freeDiskMB: 2100,
            cores: 8,
            loadAvg: [7.9, 6.2, 4.1],
            oomKillsSinceBoot: 2,
            lastOomAt: '20:11:04',
          },
          instances: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
