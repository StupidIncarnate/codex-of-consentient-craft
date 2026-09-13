import { usageLedgerContract } from './usage-ledger-contract';
import { UsageLedgerStub } from './usage-ledger.stub';

describe('usageLedgerContract', () => {
  describe('valid input', () => {
    it('VALID: {default stub} => parses buckets, cursors, ceilings and the stamp', () => {
      expect(UsageLedgerStub()).toStrictEqual({
        buckets: {
          '1789272000000': { input: 120, cacheCreation: 4_000, cacheRead: 90_000, output: 300 },
        },
        cursors: {
          '/home/user/.claude/projects/-home-user-proj/session.jsonl': {
            mtimeMs: 1_789_274_969_242,
            size: 4_096,
          },
        },
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });

    it('EMPTY: {nothing scanned yet} => parses, which is the state on a first run', () => {
      const ledger = usageLedgerContract.parse({
        buckets: {},
        cursors: {},
        ceilings: { fiveHour: null, sevenDay: null },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });

      expect(ledger).toStrictEqual({
        buckets: {},
        cursors: {},
        ceilings: { fiveHour: null, sevenDay: null },
        updatedAt: '2026-09-13T04:49:29.242Z',
      });
    });

    it('VALID: {both ceilings observed} => parses', () => {
      const ledger = UsageLedgerStub({
        ceilings: { fiveHour: 122_469_486, sevenDay: 2_751_372_486 },
      });

      expect(ledger.ceilings).toStrictEqual({
        fiveHour: 122_469_486,
        sevenDay: 2_751_372_486,
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {a negative ceiling} => throws, because spend never goes backwards', () => {
      expect(() =>
        UsageLedgerStub({ ceilings: { fiveHour: null, sevenDay: -1 as never } }),
      ).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {a negative cursor size} => throws', () => {
      expect(() =>
        UsageLedgerStub({
          cursors: { '/a/b.jsonl': { mtimeMs: 1 as never, size: -1 as never } },
        }),
      ).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {a bucket with a negative count} => throws', () => {
      expect(() =>
        UsageLedgerStub({
          buckets: {
            '1789272000000': {
              input: -5 as never,
              cacheCreation: 0 as never,
              cacheRead: 0 as never,
              output: 0 as never,
            },
          },
        }),
      ).toThrow(/greater than or equal to 0/u);
    });
  });
});
