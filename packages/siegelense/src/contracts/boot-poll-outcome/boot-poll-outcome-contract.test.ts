import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { bootPollOutcomeContract } from './boot-poll-outcome-contract';
import { BootPollOutcomeStub } from './boot-poll-outcome.stub';

type BootPollOutcome = ReturnType<typeof BootPollOutcomeStub>;

describe('bootPollOutcomeContract', () => {
  describe('the driver answered', () => {
    it('VALID: {status: ready} => parses with no message field', () => {
      const outcome: BootPollOutcome = BootPollOutcomeStub({ status: 'ready' });

      const result = bootPollOutcomeContract.parse(outcome);

      expect(result).toStrictEqual({ status: 'ready' });
    });
  });

  describe('the deadline passed with no marker', () => {
    it('VALID: {status: timeout} => parses with no message field', () => {
      const outcome: BootPollOutcome = BootPollOutcomeStub({ status: 'timeout' });

      const result = bootPollOutcomeContract.parse(outcome);

      expect(result).toStrictEqual({ status: 'timeout' });
    });
  });

  describe('a failure marker appeared', () => {
    it('VALID: {status: failed, message} => carries the driver message through', () => {
      const outcome: BootPollOutcome = BootPollOutcomeStub({
        status: 'failed',
        message: ContentTextStub({ value: 'CLAUDE_CLI_PATH is required' }),
      });

      const result = bootPollOutcomeContract.parse(outcome);

      expect(result).toStrictEqual({ status: 'failed', message: 'CLAUDE_CLI_PATH is required' });
    });
  });

  describe('invalid outcomes', () => {
    it('INVALID: {status: failed, no message} => throws validation error', () => {
      expect(() => bootPollOutcomeContract.parse({ status: 'failed' })).toThrow(/Required/u);
    });

    it('INVALID: {status: ready, extra message} => throws for an unrecognized key', () => {
      expect(() =>
        bootPollOutcomeContract.parse({ status: 'ready', message: 'should not be here' }),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {status: unknown} => throws for an invalid discriminator', () => {
      expect(() => bootPollOutcomeContract.parse({ status: 'unknown' })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });
});
