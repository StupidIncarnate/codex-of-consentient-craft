import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { isFlowriderOwnedStepGuard } from './is-flowrider-owned-step-guard';

describe('isFlowriderOwnedStepGuard', () => {
  describe('owned suffix', () => {
    it('VALID: {focusFile .e2e.ts} => returns true', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/web/src/flows/home/guild-delete.e2e.ts' },
      });

      expect(isFlowriderOwnedStepGuard({ step })).toBe(true);
    });

    it('VALID: {focusFile .integration.test.ts} => returns true', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/server/src/flows/quest/quest-flow.integration.test.ts' },
      });

      expect(isFlowriderOwnedStepGuard({ step })).toBe(true);
    });
  });

  describe('owned folder type', () => {
    it('VALID: {focusFile flows/ path} => returns true', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/web/src/flows/login/login-flow.ts' },
      });

      expect(isFlowriderOwnedStepGuard({ step })).toBe(true);
    });

    it('VALID: {focusFile startup/ path} => returns true', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/server/src/startup/start-server/start-server.ts' },
      });

      expect(isFlowriderOwnedStepGuard({ step })).toBe(true);
    });
  });

  describe('not owned', () => {
    it('VALID: {focusFile brokers/ path} => returns false', () => {
      const step = DependencyStepStub({
        focusFile: { path: 'packages/web/src/brokers/a/a-broker.ts' },
      });

      expect(isFlowriderOwnedStepGuard({ step })).toBe(false);
    });
  });

  describe('no focusFile', () => {
    it('EMPTY: {step: undefined} => returns false', () => {
      expect(isFlowriderOwnedStepGuard({})).toBe(false);
    });
  });
});
