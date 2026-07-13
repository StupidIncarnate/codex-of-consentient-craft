import {
  OperationItemIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { signalBackBroker } from './signal-back-broker';
import { signalBackBrokerProxy } from './signal-back-broker.proxy';
import { SignalBackInputStub } from '../../../contracts/signal-back-input/signal-back-input.stub';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
const operationItemId = OperationItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });

describe('signalBackBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: "complete", questId, workItemId} => returns validated complete signal', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({ signal: 'complete' });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
        },
      });
    });

    it('VALID: {signal: "complete", operationItemId, operationStatus: "done"} => returns validated signal with operation outcome', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({
        signal: 'complete',
        operationItemId,
        operationStatus: 'done',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
          operationItemId: 'cccccccc-1111-4222-9333-444444444444',
          operationStatus: 'done',
        },
      });
    });

    it('VALID: {signal: "complete", operationItemId, operationStatus: "partial"} => returns validated signal with partial outcome', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({
        signal: 'complete',
        operationItemId,
        operationStatus: 'partial',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
          operationItemId: 'cccccccc-1111-4222-9333-444444444444',
          operationStatus: 'partial',
        },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {invalid signal type} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { questId, workItemId, signal: 'unknown' } as never,
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('VALID: {signal + ids only, no operation fields} => succeeds because operationItemId/operationStatus are optional', () => {
      signalBackBrokerProxy();

      const result = signalBackBroker({
        input: { questId, workItemId, signal: 'complete' } as never,
      });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
        },
      });
    });

    it('ERROR: {removed signal type failed} => throws validation error because failed is no longer a supported signal', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { questId, workItemId, signal: 'failed' } as never,
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('ERROR: {removed signal type failed-replan} => throws validation error because failed-replan is no longer a supported signal', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { questId, workItemId, signal: 'failed-replan' } as never,
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('ERROR: {removed field summary} => throws Unrecognized key error because summary no longer exists on the contract', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: {
            questId,
            workItemId,
            signal: 'complete',
            summary: 'Task finished',
          } as never,
        }),
      ).toThrow(/Unrecognized key/u);
    });

    it('ERROR: {missing questId} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { workItemId, signal: 'complete' } as never,
        }),
      ).toThrow(/Required/u);
    });

    it('ERROR: {missing workItemId} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { questId, signal: 'complete' } as never,
        }),
      ).toThrow(/Required/u);
    });
  });
});
