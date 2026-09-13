import { UsageBucketStub } from '@dungeonmaster/shared/contracts';

import { TranscriptReadStub } from '../../../contracts/transcript-read/transcript-read.stub';

import { foldBatchLayerBroker } from './fold-batch-layer-broker';
import { foldBatchLayerBrokerProxy } from './fold-batch-layer-broker.proxy';

const BUCKET = String(Date.parse('2026-09-13T04:00:00.000Z'));
const OLDEST = Date.parse('2026-09-06T05:00:00.000Z');

const LINE_10 = `${JSON.stringify({
  type: 'assistant',
  timestamp: '2026-09-13T04:10:00.000Z',
  message: { role: 'assistant', usage: { output_tokens: 10 } },
})}\n`;
const LINE_20 = `${JSON.stringify({
  type: 'assistant',
  timestamp: '2026-09-13T04:20:00.000Z',
  message: { role: 'assistant', usage: { output_tokens: 20 } },
})}\n`;

describe('foldBatchLayerBroker', () => {
  describe('folding', () => {
    it('EMPTY: {nothing pending} => returns the buckets untouched', async () => {
      foldBatchLayerBrokerProxy();

      const result = await foldBatchLayerBroker({
        pending: [],
        buckets: {
          [BUCKET]: UsageBucketStub({ input: 0, cacheCreation: 0, cacheRead: 0, output: 7 }),
        },
        oldestUsefulMs: OLDEST,
        batchSize: 16,
      });

      expect(result).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 7 },
      });
    });

    it('VALID: {one transcript with two lines} => adds both to the running buckets', async () => {
      const proxy = foldBatchLayerBrokerProxy();
      proxy.setupTranscript({ path: '/a/one.jsonl', contents: LINE_10 + LINE_20 });

      const result = await foldBatchLayerBroker({
        pending: [TranscriptReadStub({ path: '/a/one.jsonl', fromByte: 0 })],
        buckets: {},
        oldestUsefulMs: OLDEST,
        batchSize: 16,
      });

      expect(result).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 30 },
      });
    });

    it('VALID: {fromByte past the first line} => folds only the tail', async () => {
      const proxy = foldBatchLayerBrokerProxy();
      proxy.setupTranscript({ path: '/a/one.jsonl', contents: LINE_10 + LINE_20 });

      const result = await foldBatchLayerBroker({
        pending: [TranscriptReadStub({ path: '/a/one.jsonl', fromByte: LINE_10.length })],
        buckets: {},
        oldestUsefulMs: OLDEST,
        batchSize: 16,
      });

      expect(result).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 20 },
      });
    });

    it('VALID: {three transcripts across two batches} => folds every one of them', async () => {
      const proxy = foldBatchLayerBrokerProxy();
      proxy.setupTranscript({ path: '/a/one.jsonl', contents: LINE_10 });
      proxy.setupTranscript({ path: '/a/two.jsonl', contents: LINE_10 });
      proxy.setupTranscript({ path: '/a/three.jsonl', contents: LINE_20 });

      const result = await foldBatchLayerBroker({
        pending: [
          TranscriptReadStub({ path: '/a/one.jsonl' }),
          TranscriptReadStub({ path: '/a/two.jsonl' }),
          TranscriptReadStub({ path: '/a/three.jsonl' }),
        ],
        buckets: {},
        oldestUsefulMs: OLDEST,
        // Smaller than the list, so the recursion has to carry the accumulator across batches.
        batchSize: 2,
      });

      expect(result).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 40 },
      });
    });
  });

  describe('lines outside the window', () => {
    it('VALID: {a line older than the window} => is not folded in', async () => {
      const proxy = foldBatchLayerBrokerProxy();
      const old = `${JSON.stringify({
        type: 'assistant',
        timestamp: '2026-08-01T04:10:00.000Z',
        message: { role: 'assistant', usage: { output_tokens: 999 } },
      })}\n`;
      proxy.setupTranscript({ path: '/a/one.jsonl', contents: old + LINE_10 });

      const result = await foldBatchLayerBroker({
        pending: [TranscriptReadStub({ path: '/a/one.jsonl' })],
        buckets: {},
        oldestUsefulMs: OLDEST,
        batchSize: 16,
      });

      expect(result).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 },
      });
    });
  });

  describe('a transcript that cannot be read', () => {
    it('ERROR: {one unreadable file} => is skipped, and its batch-mates still fold', async () => {
      const proxy = foldBatchLayerBrokerProxy();
      proxy.setupUnreadableTranscript({ path: '/a/denied.jsonl' });
      proxy.setupTranscript({ path: '/a/ok.jsonl', contents: LINE_20 });

      const result = await foldBatchLayerBroker({
        pending: [
          TranscriptReadStub({ path: '/a/denied.jsonl' }),
          TranscriptReadStub({ path: '/a/ok.jsonl' }),
        ],
        buckets: {},
        oldestUsefulMs: OLDEST,
        batchSize: 16,
      });

      expect(result).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 20 },
      });
    });
  });
});
