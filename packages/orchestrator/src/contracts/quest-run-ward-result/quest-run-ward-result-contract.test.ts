import { questRunWardResultContract } from './quest-run-ward-result-contract';
import { QuestRunWardResultStub } from './quest-run-ward-result.stub';

describe('questRunWardResultContract', () => {
  describe('valid results', () => {
    it('VALID: {minimal pass result} => parses successfully', () => {
      const result = QuestRunWardResultStub();

      expect(result).toStrictEqual({
        success: true,
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 0,
        wardResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      });
    });

    it('VALID: {result with lastWardRunId} => parses successfully', () => {
      const result = QuestRunWardResultStub({ lastWardRunId: '1739625600000-a3f1' });

      expect(result).toStrictEqual({
        success: true,
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 0,
        wardResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        lastWardRunId: '1739625600000-a3f1',
      });
    });

    it('VALID: {non-zero exitCode} => parses successfully', () => {
      const result = QuestRunWardResultStub({ exitCode: 1 });

      expect(result).toStrictEqual({
        success: true,
        questId: 'add-auth',
        workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 1,
        wardResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {success: false} => throws validation error', () => {
      expect(() => {
        questRunWardResultContract.parse({
          success: false,
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          exitCode: 0,
          wardResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        });
      }).toThrow(/literal/u);
    });

    it('INVALID: {invalid wardResultId} => throws validation error', () => {
      expect(() => {
        questRunWardResultContract.parse({
          success: true,
          questId: 'add-auth',
          workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          exitCode: 0,
          wardResultId: 'not-a-uuid',
        });
      }).toThrow(/uuid/u);
    });
  });
});
