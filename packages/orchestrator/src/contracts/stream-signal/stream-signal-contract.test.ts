import { OperationItemIdStub } from '@dungeonmaster/shared/contracts';

import { streamSignalContract } from './stream-signal-contract';
import { StreamSignalStub } from './stream-signal.stub';

const OPERATION_ITEM_ID = OperationItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });

describe('streamSignalContract', () => {
  describe('valid signals', () => {
    it('VALID: {signal: "complete"} => parses complete signal', () => {
      const result = streamSignalContract.parse({
        signal: 'complete',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
      });
    });

    it('VALID: {signal: "complete", operationItemId, operationStatus: "done"} => parses done outcome', () => {
      const result = streamSignalContract.parse({
        signal: 'complete',
        operationItemId: OPERATION_ITEM_ID,
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        operationItemId: OPERATION_ITEM_ID,
        operationStatus: 'done',
      });
    });

    it('VALID: {signal: "complete", operationStatus: "partial"} => parses partial outcome', () => {
      const result = streamSignalContract.parse({
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        operationStatus: 'partial',
      });
    });

    it('VALID: stub default => returns complete signal with no outcome fields', () => {
      const signal = StreamSignalStub();

      expect(signal).toStrictEqual({
        signal: 'complete',
      });
    });
  });

  describe('invalid signals', () => {
    it('INVALID: {signal: "failed"} => throws for the removed failure signal', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'failed',
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {signal: "failed-replan"} => throws for the removed replan signal', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'failed-replan',
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {signal: "partially-complete"} => throws for removed signal type', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'partially-complete',
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {signal: missing} => throws (the complete literal is required)', () => {
      expect(() => streamSignalContract.parse({})).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {operationStatus: "bogus"} => throws for an unknown operation status', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'complete',
          operationStatus: 'bogus',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
