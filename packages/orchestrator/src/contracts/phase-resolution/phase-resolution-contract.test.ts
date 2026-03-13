import { phaseResolutionContract } from './phase-resolution-contract';
import { PhaseResolutionStub } from './phase-resolution.stub';

describe('phaseResolutionContract', () => {
  describe('valid resolutions', () => {
    it('VALID: minimal resolution => parses successfully', () => {
      const resolution = PhaseResolutionStub();

      const result = phaseResolutionContract.parse(resolution);

      expect(result).toStrictEqual({
        action: 'launch-pathseeker',
      });
    });

    it('VALID: resolution with role => parses successfully', () => {
      const resolution = PhaseResolutionStub({
        action: 'launch-chat',
        role: 'chaoswhisperer',
      });

      const result = phaseResolutionContract.parse(resolution);

      expect(result).toStrictEqual({
        action: 'launch-chat',
        role: 'chaoswhisperer',
      });
    });

    it('VALID: resolution with resumeSessionId => parses successfully', () => {
      const resolution = PhaseResolutionStub({
        action: 'resume-chat',
        role: 'chaoswhisperer',
        resumeSessionId: 'session-abc',
      });

      const result = phaseResolutionContract.parse(resolution);

      expect(result).toStrictEqual({
        action: 'resume-chat',
        role: 'chaoswhisperer',
        resumeSessionId: 'session-abc',
      });
    });

    it('VALID: resolution with resetStepIds => parses successfully', () => {
      const resolution = PhaseResolutionStub({
        action: 'launch-codeweaver',
        resetStepIds: ['create-login-api', 'create-auth-guard'],
      });

      const result = phaseResolutionContract.parse(resolution);

      expect(result).toStrictEqual({
        action: 'launch-codeweaver',
        resetStepIds: ['create-login-api', 'create-auth-guard'],
      });
    });

    it('VALID: resolution with context => parses successfully', () => {
      const resolution = PhaseResolutionStub({
        action: 'wait-for-user',
        context: 'User must approve flows (Gate 1)',
      });

      const result = phaseResolutionContract.parse(resolution);

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User must approve flows (Gate 1)',
      });
    });
  });

  describe('invalid resolutions', () => {
    it('INVALID: missing action => throws validation error', () => {
      expect(() => {
        phaseResolutionContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: unknown action => throws validation error', () => {
      expect(() => {
        phaseResolutionContract.parse({ action: 'unknown' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
