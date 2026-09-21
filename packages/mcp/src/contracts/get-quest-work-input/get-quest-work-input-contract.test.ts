import { getQuestWorkInputContract } from './get-quest-work-input-contract';
import { GetQuestWorkInputStub } from './get-quest-work-input.stub';

describe('getQuestWorkInputContract', () => {
  describe('valid input', () => {
    it('VALID: {questId, workItemId} => parses the session shape', () => {
      const input = GetQuestWorkInputStub();

      expect({ questId: input.questId, workItemId: input.workItemId }).toStrictEqual({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });

    it('VALID: {questId, operationItemId} => parses the plan-review shape', () => {
      const input = getQuestWorkInputContract.parse({
        questId: 'add-auth',
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      });

      expect({ questId: input.questId, operationItemId: input.operationItemId }).toStrictEqual({
        questId: 'add-auth',
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {questId, workItemId, operationItemId} => all three are REFUSED', () => {
      expect(() =>
        getQuestWorkInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/operationItemId cannot be combined with workItemId/u);
    });

    it('EMPTY: {questId alone} => refused, because there is no whole-quest browse form', () => {
      expect(() => getQuestWorkInputContract.parse({ questId: 'add-auth' })).toThrow(
        /There is no whole-quest browse form/u,
      );
    });

    it('INVALID: {an undeclared key} => refused by .strict()', () => {
      expect(() =>
        getQuestWorkInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'send-flow',
        }),
      ).toThrow(/Unrecognized key/u);
    });

    it('EMPTY: {no questId} => refused', () => {
      expect(() =>
        getQuestWorkInputContract.parse({
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/questId/u);
    });
  });
});
