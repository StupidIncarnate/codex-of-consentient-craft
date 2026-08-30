import { getQuestInputConflictsStatics } from '../../statics/get-quest-input-conflicts/get-quest-input-conflicts-statics';
import { getQuestInputContract } from './get-quest-input-contract';
import { GetQuestInputStub } from './get-quest-input.stub';

describe('getQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId with stage} => parses with stage value', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', stage: 'spec' });
    });

    it('VALID: {questId with flowId} => parses the flowrider / siegemaster slice call', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', flowId: 'login-flow' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', flowId: 'login-flow' });
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
      });
    });

    it('VALID: {questId with packageName alone} => parses the foundation-view call', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', packageName: 'shared' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', packageName: 'shared' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
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

    it('INVALID: {slice key} => throws Unrecognized key error (removed field)', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          slice: ['backend'],
        } as never);
      }).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {flowId: "Login Flow"} => throws, because a flow id is kebab-case', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: 'add-auth', flowId: 'Login Flow' });
      }).toThrow(/Invalid/u);
    });

    // `stage` selects SECTIONS and the slice arguments select WITHIN the flows section, so a stage
    // that excludes flows would answer a flow call with nothing — which reads as "this flow is
    // empty" rather than as a rejected call.
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
  });
});
