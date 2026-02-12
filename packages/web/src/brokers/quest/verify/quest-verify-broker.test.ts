import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { QuestVerifyResultStub } from '../../../contracts/quest-verify-result/quest-verify-result.stub';
import { QuestVerifyCheckStub } from '../../../contracts/quest-verify-check/quest-verify-check.stub';

import { questVerifyBroker } from './quest-verify-broker';
import { questVerifyBrokerProxy } from './quest-verify-broker.proxy';

describe('questVerifyBroker', () => {
  describe('successful verification', () => {
    it('VALID: {questId} => returns verification result', async () => {
      const proxy = questVerifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const verifyResult = QuestVerifyResultStub({
        success: true,
        checks: [
          QuestVerifyCheckStub({ name: 'dependency-graph', passed: true }),
          QuestVerifyCheckStub({ name: 'observable-coverage', passed: true }),
        ],
      });

      proxy.setupVerify({ result: verifyResult });

      const result = await questVerifyBroker({ questId });

      expect(result).toStrictEqual(verifyResult);
    });
  });

  describe('failed verification', () => {
    it('VALID: {questId with issues} => returns failed checks', async () => {
      const proxy = questVerifyBrokerProxy();
      const questId = QuestIdStub({ value: 'broken-quest' });
      const verifyResult = QuestVerifyResultStub({
        success: false,
        checks: [QuestVerifyCheckStub({ name: 'dependency-graph', passed: false })],
      });

      proxy.setupVerify({ result: verifyResult });

      const result = await questVerifyBroker({ questId });

      expect(result).toStrictEqual(verifyResult);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questVerifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError({ error: new Error('Verification failed') });

      await expect(questVerifyBroker({ questId })).rejects.toThrow('Verification failed');
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = questVerifyBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupInvalidResponse({ data: { bad: 'data' } });

      await expect(questVerifyBroker({ questId })).rejects.toThrow(/invalid_type/u);
    });
  });
});
