import { resetFlowSignoffsInputContract } from './reset-flow-signoffs-input-contract';
import { ResetFlowSignoffsInputStub } from './reset-flow-signoffs-input.stub';

describe('resetFlowSignoffsInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId, workItemId, flowId, reason} => parses successfully', () => {
      expect(resetFlowSignoffsInputContract.parse(ResetFlowSignoffsInputStub())).toStrictEqual({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        reason:
          'Fixed the redirect guard the walk exposed, so every sign-off on this flow is stale.',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing workItemId} => throws, there is no ambient caller identity to fall back on', () => {
      expect(() =>
        resetFlowSignoffsInputContract.parse({
          questId: 'add-auth',
          flowId: 'login-flow',
          reason: 'fixed it',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing flowId} => throws, this tool resets exactly one flow', () => {
      expect(() =>
        resetFlowSignoffsInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          reason: 'fixed it',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing reason} => throws, a reset must say what changed underneath the sign-offs', () => {
      expect(() =>
        resetFlowSignoffsInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
        }),
      ).toThrow(/Required/u);
    });

    it('EMPTY: {reason: ""} => throws validation error', () => {
      expect(() =>
        resetFlowSignoffsInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key, there is no per-unit sub-scope', () => {
      expect(() =>
        resetFlowSignoffsInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'fixed it',
          unitId: 'login-flow:terminal:dashboard',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {track: flowrider} => throws, this tool never clears the other track', () => {
      expect(() =>
        resetFlowSignoffsInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'fixed it',
          track: 'flowrider',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
