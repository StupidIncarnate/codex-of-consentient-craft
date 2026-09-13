import { UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { usageLedgerScanBroker } from './usage-ledger-scan-broker';
import { usageLedgerScanBrokerProxy } from './usage-ledger-scan-broker.proxy';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');
const BUCKET = String(Date.parse('2026-09-13T04:00:00.000Z'));

// Two assistant lines in the 04:00 hour, 10 and 20 output tokens.
const FIRST_LINE = `${JSON.stringify({
  type: 'assistant',
  timestamp: '2026-09-13T04:10:00.000Z',
  message: { role: 'assistant', usage: { output_tokens: 10 } },
})}\n`;
const SECOND_LINE = `${JSON.stringify({
  type: 'assistant',
  timestamp: '2026-09-13T04:20:00.000Z',
  message: { role: 'assistant', usage: { output_tokens: 20 } },
})}\n`;

describe('usageLedgerScanBroker', () => {
  describe('a first scan', () => {
    it('VALID: {one transcript with two usage lines} => sums both into that hour', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE + SECOND_LINE;
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 30 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': {
            mtimeMs: NOW - HOUR,
            size: contents.length,
          },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });
  });

  describe('a transcript that grew', () => {
    it('VALID: {the first line already counted} => counts ONLY the appended line', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE + SECOND_LINE;
      // The ledger already holds the first line's 10 output tokens and a cursor at its length.
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
          cursors: {
            '/home/user/.claude/projects/a.jsonl': {
              mtimeMs: NOW - 2 * HOUR,
              size: FIRST_LINE.length,
            },
          },
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      // 10 already counted plus the 20 that was appended. A whole re-read would have made it 40.
      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 30 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': {
            mtimeMs: NOW - HOUR,
            size: contents.length,
          },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });

    it('VALID: {a transcript unchanged since last scan} => is not re-read, so its buckets stand', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE;
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
          cursors: {
            '/home/user/.claude/projects/a.jsonl': {
              mtimeMs: NOW - HOUR,
              size: contents.length,
            },
          },
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': {
            mtimeMs: NOW - HOUR,
            size: contents.length,
          },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });
  });

  describe('a transcript that is no longer a prefix of what was counted', () => {
    it('VALID: {the file shrank} => rebuilds every bucket from scratch rather than double-counting', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE;
      // A cursor claiming more bytes than the file now has: the counted bytes are gone.
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 999 } },
          cursors: {
            '/home/user/.claude/projects/a.jsonl': {
              mtimeMs: NOW - 2 * HOUR,
              size: contents.length + 500,
            },
          },
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      // The stale 999 is gone; only what is on disk now is counted.
      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': {
            mtimeMs: NOW - HOUR,
            size: contents.length,
          },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });

    it('VALID: {same length but a newer mtime} => also rebuilds, because the bytes were replaced', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE;
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 999 } },
          cursors: {
            '/home/user/.claude/projects/a.jsonl': {
              mtimeMs: NOW - 2 * HOUR,
              size: contents.length,
            },
          },
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': {
            mtimeMs: NOW - HOUR,
            size: contents.length,
          },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });
  });

  describe('the scan throttle', () => {
    it('VALID: {a ledger measured seconds ago} => returns it unread, without walking the tree', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE;
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
          cursors: {},
          // Thirty seconds old, inside the one-minute throttle.
          updatedAt: new Date(NOW - 30_000).toISOString(),
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      const result = await usageLedgerScanBroker({ nowMs: NOW });

      // Nothing written at all — the guardrail polls every few seconds and a stat pass over ~2,200
      // files at that cadence would spend real CPU to learn a number that moves over minutes.
      expect(proxy.getWrittenLedger()).toBe(undefined);
      expect(result.buckets).toStrictEqual({
        [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 },
      });
    });

    it('EDGE: {a ledger measured just over a minute ago} => rescans', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE;
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          updatedAt: new Date(NOW - 60_001).toISOString(),
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': { mtimeMs: NOW - HOUR, size: contents.length },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: new Date(NOW - 60_001).toISOString(),
      });
    });

    it('EMPTY: {a ledger never written} => rescans, because the epoch stamp is long past the throttle', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      const contents = FIRST_LINE;
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          updatedAt: '1970-01-01T00:00:00.000Z',
        }),
      });
      proxy.setupTranscripts({
        files: [{ name: 'a.jsonl', mtimeMs: NOW - HOUR, size: contents.length, contents }],
      });

      await usageLedgerScanBroker({ nowMs: NOW });

      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: { [BUCKET]: { input: 0, cacheCreation: 0, cacheRead: 0, output: 10 } },
        cursors: {
          '/home/user/.claude/projects/a.jsonl': { mtimeMs: NOW - HOUR, size: contents.length },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '1970-01-01T00:00:00.000Z',
      });
    });
  });

  describe('what the scan never touches', () => {
    it('VALID: {a calibrated ceiling} => is carried through unchanged', async () => {
      const proxy = usageLedgerScanBrokerProxy();
      proxy.setupExistingLedger({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: 122_469_486, sevenDay: 2_751_372_486 },
        }),
      });
      proxy.setupTranscripts({ files: [] });

      await usageLedgerScanBroker({ nowMs: NOW });

      expect(proxy.getWrittenLedger()).toStrictEqual({
        buckets: {},
        cursors: {},
        ceilings: { fiveHour: 122_469_486, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });
  });
});
