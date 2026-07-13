import { OperationItemIdStub } from '@dungeonmaster/shared/contracts';

import { signalBackResultContract } from './signal-back-result-contract';
import { SignalBackResultStub } from './signal-back-result.stub';
import { SignalBackInputStub } from '../signal-back-input/signal-back-input.stub';

describe('signalBackResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success: true, signal: complete} => parses successfully', () => {
      const signal = SignalBackInputStub({ signal: 'complete' });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
        },
      });
    });

    it('VALID: {success: true, signal: complete with operationItemId + operationStatus} => parses signal with operation outcome', () => {
      const operationItemId = OperationItemIdStub({
        value: 'cccccccc-1111-4222-9333-444444444444',
      });
      const signal = SignalBackInputStub({
        signal: 'complete',
        operationItemId,
        operationStatus: 'done',
      });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

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

    it('VALID: {success: false, signal: complete} => parses with false success', () => {
      const signal = SignalBackInputStub({ signal: 'complete' });

      const result = signalBackResultContract.parse({
        success: false,
        signal,
      });

      expect(result).toStrictEqual({
        success: false,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
        },
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = SignalBackResultStub();

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
          signal: 'complete',
        },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {success: "yes"} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: 'yes',
          signal: SignalBackInputStub(),
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID: {signal: null} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
          signal: null,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID: {signal: missing} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {success: missing} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          signal: SignalBackInputStub(),
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {signal: {signal: "failed"}} => throws validation error because failed is no longer a supported inner signal', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
          signal: {
            questId: 'aaaaaaaa-1111-4222-9333-444444444444',
            workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
            signal: 'failed',
          },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {signal: {summary: "removed field"}} => throws Unrecognized key error because summary no longer exists on the inner signal', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
          signal: {
            questId: 'aaaaaaaa-1111-4222-9333-444444444444',
            workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
            signal: 'complete',
            summary: 'Done',
          },
        });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
