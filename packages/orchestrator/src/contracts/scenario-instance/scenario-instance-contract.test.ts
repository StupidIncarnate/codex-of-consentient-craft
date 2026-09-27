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
          codeweaver: ['signalComplete', 'signalDone'],
          spiritmender: ['signalComplete'],
        },
        callOrdinals: { codeweaver: 1 },
      });

      expect(result).toStrictEqual({
        scripts: {
          codeweaver: ['signalComplete', 'signalDone'],
          spiritmender: ['signalComplete'],
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
      }).toThrow(/Invalid option/u);
    });

    it('INVALID: {scripts unknown role} => throws validation error', () => {
      expect(() => {
        scenarioInstanceContract.parse({
          scripts: { bogusRole: ['signalComplete'] },
          callOrdinals: {},
        });
      }).toThrow(/Unrecognized key: \\"bogusRole\\"/u);
    });

    it('INVALID: {scripts pathseeker role} => throws validation error (removed role)', () => {
      expect(() => {
        scenarioInstanceContract.parse({
          scripts: { pathseeker: ['signalComplete'] },
          callOrdinals: {},
        });
      }).toThrow(/Unrecognized key: \\"pathseeker\\"/u);
    });

    it('INVALID: {callOrdinals negative} => throws validation error', () => {
      expect(() => {
        scenarioInstanceContract.parse({
          scripts: { codeweaver: ['signalComplete'] },
          callOrdinals: { codeweaver: -1 },
        });
      }).toThrow(/to be >=0/u);
    });
  });
});
