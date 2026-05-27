import { isProjectReferencesModeGuard } from './is-project-references-mode-guard';

describe('isProjectReferencesModeGuard', () => {
  describe('mode enabled', () => {
    it('VALID: {rootHasWorkspaces: true, eligibleWorkspaceCount: 1} => returns true', () => {
      expect(
        isProjectReferencesModeGuard({ rootHasWorkspaces: true, eligibleWorkspaceCount: 1 }),
      ).toBe(true);
    });

    it('VALID: {rootHasWorkspaces: true, eligibleWorkspaceCount: 11} => returns true', () => {
      expect(
        isProjectReferencesModeGuard({ rootHasWorkspaces: true, eligibleWorkspaceCount: 11 }),
      ).toBe(true);
    });
  });

  describe('mode disabled', () => {
    it('VALID: {rootHasWorkspaces: false, eligibleWorkspaceCount: 5} => returns false', () => {
      expect(
        isProjectReferencesModeGuard({ rootHasWorkspaces: false, eligibleWorkspaceCount: 5 }),
      ).toBe(false);
    });

    it('VALID: {rootHasWorkspaces: true, eligibleWorkspaceCount: 0} => returns false', () => {
      expect(
        isProjectReferencesModeGuard({ rootHasWorkspaces: true, eligibleWorkspaceCount: 0 }),
      ).toBe(false);
    });

    it('EMPTY: {rootHasWorkspaces: undefined, eligibleWorkspaceCount: 5} => returns false', () => {
      expect(isProjectReferencesModeGuard({ eligibleWorkspaceCount: 5 })).toBe(false);
    });

    it('EMPTY: {rootHasWorkspaces: true, eligibleWorkspaceCount: undefined} => returns false', () => {
      expect(isProjectReferencesModeGuard({ rootHasWorkspaces: true })).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      expect(isProjectReferencesModeGuard({})).toBe(false);
    });
  });
});
