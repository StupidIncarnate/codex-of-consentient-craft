import { signalBackBroker } from './signal-back-broker';
import { signalBackBrokerProxy } from './signal-back-broker.proxy';
import { SignalBackInputStub } from '../../../contracts/signal-back-input/signal-back-input.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('signalBackBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: "complete"} => returns validated complete signal', () => {
      signalBackBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const input = SignalBackInputStub({
        signal: 'complete',
        stepId,
        summary: 'Task finished',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          summary: 'Task finished',
        },
      });
    });
  });

  describe('partially-complete signal', () => {
    it('VALID: {signal: "partially-complete"} => returns validated partially-complete signal', () => {
      signalBackBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const input = SignalBackInputStub({
        signal: 'partially-complete',
        stepId,
        progress: '50% done',
        continuationPoint: 'Resume at step 3',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'partially-complete',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          progress: '50% done',
          continuationPoint: 'Resume at step 3',
        },
      });
    });
  });

  describe('needs-user-input signal', () => {
    it('VALID: {signal: "needs-user-input"} => returns validated needs-user-input signal', () => {
      signalBackBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const input = SignalBackInputStub({
        signal: 'needs-user-input',
        stepId,
        question: 'Which database?',
        context: 'Setting up persistence',
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'needs-user-input',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          question: 'Which database?',
          context: 'Setting up persistence',
        },
      });
    });
  });

  describe('needs-role-followup signal', () => {
    it('VALID: {signal: "needs-role-followup"} => returns validated needs-role-followup signal', () => {
      signalBackBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const input = SignalBackInputStub({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'code-reviewer',
        reason: 'Code review needed',
        context: 'Implementation complete',
        resume: true,
      });

      const result = signalBackBroker({ input });

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'needs-role-followup',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          targetRole: 'code-reviewer',
          reason: 'Code review needed',
          context: 'Implementation complete',
          resume: true,
        },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {invalid signal type} => throws validation error', () => {
      signalBackBrokerProxy();
      const stepId = StepIdStub();

      expect(() =>
        signalBackBroker({
          input: { signal: 'unknown', stepId } as never,
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('ERROR: {missing stepId} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { signal: 'complete', summary: 'Test' } as never,
        }),
      ).toThrow(/Required/u);
    });

    it('ERROR: {invalid stepId format} => throws validation error', () => {
      signalBackBrokerProxy();

      expect(() =>
        signalBackBroker({
          input: { signal: 'complete', stepId: 'not-a-uuid', summary: 'Test' } as never,
        }),
      ).toThrow(/Invalid uuid/u);
    });
  });
});
