import { questExecuteResultContract } from './quest-execute-result-contract';
import type { QuestExecuteResultStub } from './quest-execute-result.stub';

type QuestExecuteResult = ReturnType<typeof QuestExecuteResultStub>;

describe('questExecuteResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success: true} => returns successful QuestExecuteResult', () => {
      const result: QuestExecuteResult = questExecuteResultContract.parse({
        success: true,
      });

      expect(result).toStrictEqual({
        success: true,
      });
    });

    it('VALID: {success: false, reason} => returns failed QuestExecuteResult', () => {
      const result: QuestExecuteResult = questExecuteResultContract.parse({
        success: false,
        reason: 'Ward check failed after max iterations',
      });

      expect(result).toStrictEqual({
        success: false,
        reason: 'Ward check failed after max iterations',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing success} => throws validation error', () => {
      expect(() => questExecuteResultContract.parse({})).toThrow(/Invalid discriminator/iu);
    });

    it('INVALID: {success: false without reason} => throws validation error', () => {
      expect(() =>
        questExecuteResultContract.parse({
          success: false,
        }),
      ).toThrow(/reason/iu);
    });

    it('EDGE: {success: true with extra key} => strips extra key', () => {
      const result = questExecuteResultContract.parse({
        success: true,
        reason: 'should not be here',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});

describe('QuestExecuteResultStub', () => {
  it('VALID: {default} => returns successful QuestExecuteResult', () => {
    const { QuestExecuteResultStub: Stub } = require('./quest-execute-result.stub');
    const result = Stub();

    expect(result).toStrictEqual({
      success: true,
    });
  });
});

describe('QuestExecuteResultFailedStub', () => {
  it('VALID: {default} => returns failed QuestExecuteResult with reason', () => {
    const { QuestExecuteResultFailedStub: Stub } = require('./quest-execute-result.stub');
    const result = Stub();

    expect(result).toStrictEqual({
      success: false,
      reason: 'Test failure reason',
    });
  });

  it('VALID: {custom reason} => returns failed QuestExecuteResult with custom reason', () => {
    const { QuestExecuteResultFailedStub: Stub } = require('./quest-execute-result.stub');
    const result = Stub({ reason: 'Ward check failed' });

    expect(result).toStrictEqual({
      success: false,
      reason: 'Ward check failed',
    });
  });
});
