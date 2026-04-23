import { scenarioInstanceContract } from './scenario-instance-contract';
import { ScenarioInstanceStub } from './scenario-instance.stub';

describe('scenarioInstanceContract', () => {
  describe('valid instances', () => {
    it('VALID: {default stub} => parses with codeweaver script and empty ordinals', () => {
      const result = ScenarioInstanceStub();

      expect(result).toStrictEqual({
        scripts: { codeweaver: ['signalComplete'] },
        callOrdinals: {},
      });
    });

    it('VALID: {multiple roles and ordinals} => parses successfully', () => {
      const result = ScenarioInstanceStub({
        scripts: {
          codeweaver: ['signalFailed', 'signalComplete'],
          pathseeker: ['signalComplete'],
        },
        callOrdinals: { codeweaver: 1 },
      });

      expect(result).toStrictEqual({
        scripts: {
          codeweaver: ['signalFailed', 'signalComplete'],
          pathseeker: ['signalComplete'],
        },
        callOrdinals: { codeweaver: 1 },
      });
    });
  });

  describe('invalid instances', () => {
    it('INVALID: {scripts unknown prompt name} => throws validation error', () => {
      expect(() => {
        scenarioInstanceContract.parse({
          scripts: { codeweaver: ['notARealPromptName'] },
          callOrdinals: {},
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {scripts unknown role} => throws validation error', () => {
      expect(() => {
        scenarioInstanceContract.parse({
          scripts: { bogusRole: ['signalComplete'] },
          callOrdinals: {},
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {callOrdinals negative} => throws validation error', () => {
      expect(() => {
        scenarioInstanceContract.parse({
          scripts: { codeweaver: ['signalComplete'] },
          callOrdinals: { codeweaver: -1 },
        });
      }).toThrow(/greater than or equal to 0/u);
    });
  });
});
