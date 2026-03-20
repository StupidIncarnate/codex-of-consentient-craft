import { wardQueueResponseContract } from './ward-queue-response-contract';
import { WardQueueResponseStub } from './ward-queue-response.stub';

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { WardRunIdStub } from '../ward-run-id/ward-run-id.stub';

type WardQueueResponse = ReturnType<typeof WardQueueResponseStub>;

describe('wardQueueResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {empty object} => parses response with no fields', () => {
      const result = wardQueueResponseContract.parse({});

      expect(result.exitCode).toBeUndefined();
      expect(result.runId).toBeUndefined();
    });

    it('VALID: {all fields} => parses response with all fields', () => {
      const result = wardQueueResponseContract.parse({
        exitCode: ExitCodeStub(),
        runId: WardRunIdStub(),
        wardResultJson: { summary: 'test' },
      });

      expect(result.exitCode).toBe(ExitCodeStub());
      expect(result.runId).toBe(WardRunIdStub());
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default response', () => {
      const response: WardQueueResponse = WardQueueResponseStub();

      expect(response).toBeDefined();
    });
  });

  describe('invalid responses', () => {
    it('INVALID_TYPE: {value: null} => throws for null', () => {
      expect(() => wardQueueResponseContract.parse(null as never)).toThrow(/invalid_type/u);
    });
  });
});
