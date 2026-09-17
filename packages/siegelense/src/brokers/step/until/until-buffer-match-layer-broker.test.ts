import { untilBufferMatchLayerBroker } from './until-buffer-match-layer-broker';
import { untilBufferMatchLayerBrokerProxy } from './until-buffer-match-layer-broker.proxy';

describe('untilBufferMatchLayerBroker', () => {
  describe("a match arrives within this step's own window", () => {
    it('VALID: {console line matching, 55ms elapsed} => returns the exact reading, echoing the matched text', async () => {
      const proxy = untilBufferMatchLayerBrokerProxy();
      const { readSince } = proxy.linesAnswering({
        lines: [
          JSON.stringify({ text: 'booting' }),
          JSON.stringify({ text: 'app hydrated in 240ms' }),
        ],
      });
      proxy.stageElapsedMs({ nowMs: 55 });

      const reading = await untilBufferMatchLayerBroker({
        kind: 'console',
        readSince,
        fromIndex: 0,
        startedAtMs: 0,
        deadlineAtMs: 15000,
        timeoutMs: 15000,
        matches: proxy.matchesConsoleIncluding({ substring: 'hydrated' }),
        descriptor: 'console matching /hydrated/',
        buildReading: proxy.buildConsoleArrivedReading({ pattern: 'hydrated' }),
      });

      expect(reading).toBe(
        'console line matching /hydrated/ arrived after 55ms — "app hydrated in 240ms"',
      );
    });
  });

  describe('the ceiling is hit with no match anywhere in the buffer', () => {
    it('ERROR: {12 non-matching network lines since the step began} => throws naming the count and no earlier-match sentence', async () => {
      const proxy = untilBufferMatchLayerBrokerProxy();
      const sinceLines = Array.from({ length: 12 }, () =>
        JSON.stringify({ method: 'GET', url: '/other' }),
      );
      const { readSince } = proxy.linesAnswering({ lines: sinceLines });
      proxy.stageElapsedMs({ nowMs: 1000 });

      const error = await untilBufferMatchLayerBroker({
        kind: 'network',
        readSince,
        fromIndex: 0,
        startedAtMs: 0,
        deadlineAtMs: 0,
        timeoutMs: 15000,
        matches: proxy.matchesNetwork({ method: 'POST', pathIncludes: '/api/quests' }),
        descriptor: 'response POST /api/quests',
        buildReading: proxy.buildNetworkAnsweredReading(),
      }).then(
        (): never => {
          throw new Error('Expected untilBufferMatchLayerBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message:
          'response POST /api/quests never resolved in 15000ms — 0 of 12 network lines since this step began matched.',
      });
    });
  });

  describe('the ceiling is hit but a match arrived before this run began', () => {
    it("ERROR: {a matching line 3 lines before this run's own window started} => names it as belonging to an earlier run", async () => {
      const proxy = untilBufferMatchLayerBrokerProxy();
      const earlierLines = [
        JSON.stringify({ method: 'GET', url: '/x' }),
        JSON.stringify({ method: 'GET', url: '/y' }),
        JSON.stringify({ method: 'POST', url: '/api/quests' }),
        JSON.stringify({ method: 'GET', url: '/z' }),
        JSON.stringify({ method: 'GET', url: '/w' }),
      ];
      const sinceLines = Array.from({ length: 12 }, () =>
        JSON.stringify({ method: 'GET', url: '/other' }),
      );
      const { readSince } = proxy.linesAnswering({ lines: [...earlierLines, ...sinceLines] });
      proxy.stageElapsedMs({ nowMs: 1000 });

      const error = await untilBufferMatchLayerBroker({
        kind: 'network',
        readSince,
        fromIndex: earlierLines.length,
        startedAtMs: 0,
        deadlineAtMs: 0,
        timeoutMs: 15000,
        matches: proxy.matchesNetwork({ method: 'POST', pathIncludes: '/api/quests' }),
        descriptor: 'response POST /api/quests',
        buildReading: proxy.buildNetworkAnsweredReading(),
      }).then(
        (): never => {
          throw new Error('Expected untilBufferMatchLayerBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message:
          "response POST /api/quests never resolved in 15000ms — 0 of 12 network lines since this step began matched. A match DID arrive earlier in this instance's buffer, 3 lines before this run's own window began — it belongs to an earlier run, not this one: read it back with `results --kind network --since boot`.",
      });
    });
  });
});
