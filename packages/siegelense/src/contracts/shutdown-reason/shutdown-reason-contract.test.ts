import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { shutdownReasonContract } from './shutdown-reason-contract';
import { ShutdownReasonStub } from './shutdown-reason.stub';

type ShutdownReason = ReturnType<typeof ShutdownReasonStub>;

describe('shutdownReasonContract', () => {
  describe('valid markers', () => {
    it('VALID: {reason, atMs} => parses successfully', () => {
      const marker: ShutdownReason = ShutdownReasonStub({
        reason: ContentTextStub({
          value: 'reaped by idle timeout after 900s with no run received',
        }),
        atMs: EpochMsStub({ value: 1_700_000_000_000 }),
      });

      const result = shutdownReasonContract.parse(marker);

      expect(result).toStrictEqual({
        reason: 'reaped by idle timeout after 900s with no run received',
        atMs: 1_700_000_000_000,
      });
    });
  });

  describe('invalid markers', () => {
    it('INVALID: {reason: 123} => throws validation error', () => {
      expect(() => shutdownReasonContract.parse({ reason: 123, atMs: 1_700_000_000_000 })).toThrow(
        /Expected string/u,
      );
    });

    it('INVALID: {missing atMs} => throws validation error', () => {
      expect(() => shutdownReasonContract.parse({ reason: 'reaped by idle timeout' })).toThrow(
        /Required/u,
      );
    });
  });
});
