import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { signalBackInputContract } from './signal-back-input-contract';
import { SignalBackInputStub } from './signal-back-input.stub';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

describe('signalBackInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "complete", summary, questId, workItemId} => parses complete signal', () => {
      const input = SignalBackInputStub({
        signal: 'complete',
        summary: 'Task done',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
        summary: 'Task done',
      });
    });

    it('VALID: {signal: "failed", summary} => parses failed signal', () => {
      const input = SignalBackInputStub({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });
    });

    it('VALID: {signal: "failed-replan", summary} => parses failed-replan signal', () => {
      const input = SignalBackInputStub({
        signal: 'failed-replan',
        summary: 'Semantic findings require new steps',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'failed-replan',
        summary: 'Semantic findings require new steps',
      });
    });

    it('EDGE: {signal + ids only, no summary} => parses minimal input', () => {
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

    it('VALID: {default stub} => parses with defaults', () => {
      const input = SignalBackInputStub();

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        signal: 'complete',
        summary: 'Step completed successfully',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {signal: "unknown"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'unknown',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {signal: "partially-complete"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'partially-complete',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {summary: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          questId,
          workItemId,
          signal: 'complete',
          summary: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing signal} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({ questId, workItemId });
      }).toThrow(/Required/u);
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
