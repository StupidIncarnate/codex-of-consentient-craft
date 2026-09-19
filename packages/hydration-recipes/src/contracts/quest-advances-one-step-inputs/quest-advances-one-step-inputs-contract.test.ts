import { questAdvancesOneStepInputsContract } from './quest-advances-one-step-inputs-contract';
import { QuestAdvancesOneStepInputsStub } from './quest-advances-one-step-inputs.stub';

describe('questAdvancesOneStepInputsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildId} => parses to exactly that field', () => {
      const result = questAdvancesOneStepInputsContract.parse({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    });

    it('VALID: {stub with guildId override} => parses with the overridden id', () => {
      const result = QuestAdvancesOneStepInputsStub({
        guildId: '12345678-1234-1234-1234-123456789abc',
      });

      expect(result.guildId).toBe('12345678-1234-1234-1234-123456789abc');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {guildId: "not-a-uuid"} => throws Invalid uuid', () => {
      expect(() => questAdvancesOneStepInputsContract.parse({ guildId: 'not-a-uuid' })).toThrow(
        /Invalid uuid/u,
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => questAdvancesOneStepInputsContract.parse({})).toThrow(/Required/u);
    });
  });
});
