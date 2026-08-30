import { getQuestInputConflictsStatics } from '@dungeonmaster/shared/statics';

import { getQuestInputContract } from './get-quest-input-contract';
import { GetQuestInputStub } from './get-quest-input.stub';

describe('getQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', format: 'text' });
    });

    it('VALID: {questId: "test-quest"} => parses with default stub value', () => {
      const input = GetQuestInputStub();

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'test-quest', format: 'text' });
    });

    it('VALID: {questId with stage} => parses with stage value', () => {
      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'spec',
      });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        stage: 'spec',
        format: 'text',
      });
    });

    it('VALID: {questId with implementation stage} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'implementation' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        stage: 'implementation',
        format: 'text',
      });
    });

    it('VALID: {questId without stage} => stage omitted from result', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', format: 'text' });
    });

    it('VALID: {questId with planning stage} => parses successfully', () => {
      const result = getQuestInputContract.parse({ questId: 'add-auth', stage: 'planning' });

      expect(result).toStrictEqual({
        questId: 'add-auth',
        stage: 'planning',
        format: 'text',
      });
    });

    it('VALID: {questId with flowId and packageName} => parses the codeweaver slice call', () => {
      const input = GetQuestInputStub({
        questId: 'add-auth',
        flowId: 'login-flow',
        packageName: 'web',
      });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        flowId: 'login-flow',
        packageName: 'web',
        format: 'text',
      });
    });

    it('VALID: {questId with packageName alone} => parses the foundation-view call', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', packageName: 'shared' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        packageName: 'shared',
        format: 'text',
      });
    });
  });

  describe('invalid inputs', () => {
    // The wrapper re-applies the shared contract's rejection because a `ZodEffects` cannot be
    // `.extend()`ed with `format` — so this is the half an MCP caller actually hits.
    it('INVALID: {flowId with stage} => throws naming the call to make instead', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          flowId: 'login-flow',
          stage: 'planning',
        });
      }).toThrow(getQuestInputConflictsStatics.flowIdWithStage);
    });

    it('INVALID: {packageName with stage} => throws naming the call to make instead', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          packageName: 'web',
          stage: 'spec',
        });
      }).toThrow(getQuestInputConflictsStatics.packageNameWithStage);
    });

    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {stage with invalid value} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: 'add-auth', stage: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          path: '/some/path',
        } as never);
      }).toThrow(/Unrecognized key/u);
    });
  });
});
