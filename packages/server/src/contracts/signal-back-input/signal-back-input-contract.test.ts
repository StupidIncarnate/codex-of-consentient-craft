import {
  OperationItemIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { signalBackInputContract } from './signal-back-input-contract';
import { SignalBackInputStub } from './signal-back-input.stub';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
const operationItemId = OperationItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });

describe('signalBackInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "complete", questId, workItemId} => parses minimal complete signal', () => {
      const result = signalBackInputContract.parse({
        questId,
        workItemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
      });
    });

    it('VALID: {signal: "complete", operationItemId, operationStatus: "done"} => parses done outcome', () => {
      const result = signalBackInputContract.parse({
        questId,
        workItemId,
        signal: 'complete',
        operationItemId,
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
        operationItemId: 'cccccccc-1111-4222-9333-444444444444',
        operationStatus: 'done',
      });
    });

    it('VALID: {signal: "complete", operationItemId, operationStatus: "partial"} => parses partial outcome', () => {
      const result = signalBackInputContract.parse({
        questId,
        workItemId,
        signal: 'complete',
        operationItemId,
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
        operationItemId: 'cccccccc-1111-4222-9333-444444444444',
        operationStatus: 'partial',
      });
    });

    it('VALID: {default stub} => parses with defaults', () => {
      const input = SignalBackInputStub();

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {signal: "failed"} => throws validation error because complete is the only signal', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'failed',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {missing signal} => throws validation error because the literal check rejects undefined', () => {
      expect(() => {
        signalBackInputContract.parse({ questId, workItemId });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          workItemId,
          signal: 'complete',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing workItemId} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          signal: 'complete',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {workItemId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId: 'not-a-uuid',
          signal: 'complete',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {operationItemId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'complete',
          operationItemId: 'not-a-uuid',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {operationStatus: "failed"} => throws validation error because failed is not a supported outcome', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'complete',
          operationItemId,
          operationStatus: 'failed',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error because the contract is strict', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'complete',
          status: 'done',
        } as never);
      }).toThrow(/Unrecognized key/u);
    });
  });
});
