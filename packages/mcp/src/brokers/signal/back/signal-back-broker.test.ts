import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { signalBackBroker } from './signal-back-broker';
import { signalBackBrokerProxy } from './signal-back-broker.proxy';
import { SignalBackInputStub } from '../../../contracts/signal-back-input/signal-back-input.stub';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

describe('signalBackBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: "complete", questId, workItemId} => returns validated complete signal', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({
        signal: 'complete',
        summary: 'Task finished',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
          summary: 'Task finished',
        },
      });
    });
  });

  describe('failed signal', () => {
    it('VALID: {signal: "failed", questId, workItemId} => returns validated failed signal', () => {
      signalBackBrokerProxy();
      const input = SignalBackInputStub({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'failed',
          summary: 'Tests failing in user-fetch-broker',
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
      ).toThrow(/Invalid enum value/u);
    });

    it('VALID: {signal + ids only, no summary} => succeeds because summary is optional', () => {
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

    it('ERROR: {removed signal type partially-complete} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { questId, workItemId, signal: 'partially-complete' } as never,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('ERROR: {removed signal type needs-role-followup} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { questId, workItemId, signal: 'needs-role-followup' } as never,
        }),
      ).toThrow(/Invalid enum value/u);
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
