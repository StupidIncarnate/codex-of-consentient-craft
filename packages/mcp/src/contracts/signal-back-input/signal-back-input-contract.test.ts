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

    it('VALID: {signal: "complete", operationItemId} => parses with the operation item id alone', () => {
      const result = signalBackInputContract.parse({
        questId,
        workItemId,
        signal: 'complete',
        operationItemId,
      });

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
        operationItemId: 'cccccccc-1111-4222-9333-444444444444',
      });
    });

    it('VALID: {blockedReason, no operationItemId} => parses, because the refinement tying it to operationStatus is gone', () => {
      const result = signalBackInputContract.parse({
        questId,
        workItemId,
        signal: 'complete',
        blockedReason: 'git commit is denied in this dispatched session',
      });

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
        blockedReason: 'git commit is denied in this dispatched session',
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

  describe('blockedReason validates on its own, unrefined', () => {
    it('EMPTY: {blockedReason: ""} => throws because an empty reason explains nothing', () => {
      expect(() =>
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'complete',
          blockedReason: '',
        }),
      ).toThrow(/String must contain at least 1 character/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {signal: "failed"} => throws validation error because failed is no longer a supported signal', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'failed',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {signal: "failed-replan"} => throws validation error because failed-replan is no longer a supported signal', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'failed-replan',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {signal: "unknown"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'unknown',
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

    it.each(['done', 'partial', 'blocked'] as const)(
      'INVALID: {operationStatus: "%s"} => throws Unrecognized key error because operationStatus no longer exists on the contract',
      (value) => {
        expect(() => {
          signalBackInputContract.parse({
            questId,
            workItemId,
            signal: 'complete',
            operationItemId,
            operationStatus: value,
          } as never);
        }).toThrow(/Unrecognized key/u);
      },
    );

    it('INVALID: {summary: "removed field"} => throws Unrecognized key error because summary no longer exists on the contract', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'complete',
          summary: 'Task done',
        } as never);
      }).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
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
