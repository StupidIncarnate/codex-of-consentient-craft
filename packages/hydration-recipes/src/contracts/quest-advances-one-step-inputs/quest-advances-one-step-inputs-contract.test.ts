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
        guildId: '7a33141f-192d-204d-847e-9918b4840d56',
      });

      expect(result.guildId).toBe('7a33141f-192d-204d-847e-9918b4840d56');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {guildId: "not-a-uuid"} => throws Invalid uuid', () => {
      expect(() => questAdvancesOneStepInputsContract.parse({ guildId: 'not-a-uuid' })).toThrow(
        /Invalid UUID/u,
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {} => throws "received undefined"', () => {
      expect(() => questAdvancesOneStepInputsContract.parse({})).toThrow(/received undefined/u);
    });
  });
});
