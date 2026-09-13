import { UsageBucketStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { usageLedgerCalibrateBroker } from './usage-ledger-calibrate-broker';
import { usageLedgerCalibrateBrokerProxy } from './usage-ledger-calibrate-broker.proxy';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');
// 200 output tokens weight to 1000.
const SPEND = UsageBucketStub({ input: 0, cacheCreation: 0, cacheRead: 0, output: 200 });

describe('usageLedgerCalibrateBroker', () => {
  describe('a first refusal', () => {
    it('VALID: {seven-day refusal, 1000 spent} => records 1000 as that ceiling', async () => {
      const proxy = usageLedgerCalibrateBrokerProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - HOUR)]: SPEND },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      const result = await usageLedgerCalibrateBroker({ window: 'seven-day', nowMs: NOW });

      expect(result.ceilings).toStrictEqual({ fiveHour: null, sevenDay: 1_000 });
    });

    it('VALID: {five-hour refusal} => records the five-hour ceiling and leaves seven-day alone', async () => {
      const proxy = usageLedgerCalibrateBrokerProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - HOUR)]: SPEND },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        }),
      });

      const result = await usageLedgerCalibrateBroker({ window: 'five-hour', nowMs: NOW });

      expect(result.ceilings).toStrictEqual({ fiveHour: 1_000, sevenDay: 2_751_372_486 });
    });

    it('VALID: {only spend inside the window counts} => older spend is excluded from the ceiling', async () => {
      const proxy = usageLedgerCalibrateBrokerProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: SPEND,
            // Ten hours ago — inside seven days, outside five hours.
            [String(NOW - 10 * HOUR)]: SPEND,
          },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      const result = await usageLedgerCalibrateBroker({ window: 'five-hour', nowMs: NOW });

      expect(result.ceilings.fiveHour).toBe(1_000);
    });
  });

  describe('a later refusal', () => {
    it('VALID: {a higher observation} => raises the ceiling', async () => {
      const proxy = usageLedgerCalibrateBrokerProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - HOUR)]: SPEND },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 800 },
        }),
      });

      const result = await usageLedgerCalibrateBroker({ window: 'seven-day', nowMs: NOW });

      expect(result.ceilings.sevenDay).toBe(1_000);
    });

    it('VALID: {a lower observation} => keeps the higher ceiling, because a refusal can land late', async () => {
      const proxy = usageLedgerCalibrateBrokerProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - HOUR)]: SPEND },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 1_500 },
        }),
      });

      const result = await usageLedgerCalibrateBroker({ window: 'seven-day', nowMs: NOW });

      expect(result.ceilings.sevenDay).toBe(1_500);
    });
  });

  describe('nothing to calibrate against', () => {
    it('EMPTY: {no spend measured yet} => writes nothing rather than recording a zero ceiling', async () => {
      const proxy = usageLedgerCalibrateBrokerProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      const result = await usageLedgerCalibrateBroker({ window: 'seven-day', nowMs: NOW });

      expect([result.ceilings, proxy.getWrittenLedger()]).toStrictEqual([
        { fiveHour: null, sevenDay: null },
        undefined,
      ]);
    });
  });
});
