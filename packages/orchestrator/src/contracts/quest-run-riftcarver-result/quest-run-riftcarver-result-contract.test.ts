import { questRunRiftcarverResultContract } from './quest-run-riftcarver-result-contract';
import { QuestRunRiftcarverResultStub } from './quest-run-riftcarver-result.stub';

describe('questRunRiftcarverResultContract', () => {
  describe('valid results', () => {
    it('VALID: {green carve} => parses successfully', () => {
      const result = QuestRunRiftcarverResultStub();

      expect(result).toStrictEqual({
        success: true,
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 0,
        riftcarverResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        outcome: 'green',
      });
    });

    it('VALID: {repairable carve naming the failing step} => parses successfully', () => {
      const result = QuestRunRiftcarverResultStub({
        exitCode: 1,
        outcome: 'repairable',
        failedStep: 'build',
      });

      expect(result).toStrictEqual({
        success: true,
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 1,
        riftcarverResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        outcome: 'repairable',
        failedStep: 'build',
      });
    });

    it('VALID: {blocked carve naming the failing step} => parses successfully', () => {
      const result = QuestRunRiftcarverResultStub({
        exitCode: 1,
        outcome: 'blocked',
        failedStep: 'create',
      });

      expect(result).toStrictEqual({
        success: true,
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 1,
        riftcarverResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        outcome: 'blocked',
        failedStep: 'create',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {success: false} => throws validation error', () => {
      expect(() => {
        questRunRiftcarverResultContract.parse({
          success: false,
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          exitCode: 0,
          riftcarverResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          outcome: 'green',
        });
      }).toThrow(/literal/u);
    });

    it('INVALID: {riftcarverResultId is not a uuid} => throws validation error', () => {
      expect(() => {
        questRunRiftcarverResultContract.parse({
          success: true,
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          exitCode: 0,
          riftcarverResultId: 'not-a-uuid',
          outcome: 'green',
        });
      }).toThrow(/uuid/u);
    });

    it('INVALID: {outcome outside the three landing places} => throws validation error', () => {
      expect(() => {
        questRunRiftcarverResultContract.parse({
          success: true,
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          exitCode: 0,
          riftcarverResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          outcome: 'failed',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
