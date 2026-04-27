import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { hasCheckDiscoveryMismatchGuard } from './has-check-discovery-mismatch-guard';

describe('hasCheckDiscoveryMismatchGuard', () => {
  describe('matched counts', () => {
    it('VALID: {discovered=files, no passthrough} => returns false', () => {
      const check = CheckResultStub({
        projectResults: [ProjectResultStub({ filesCount: 100, discoveredCount: 100 })],
      });

      expect(hasCheckDiscoveryMismatchGuard({ check, hasPassthrough: false })).toBe(false);
    });
  });

  describe('mismatch detection', () => {
    it('VALID: {discovered>files, no passthrough} => returns true', () => {
      const check = CheckResultStub({
        projectResults: [ProjectResultStub({ filesCount: 5, discoveredCount: 10 })],
      });

      expect(hasCheckDiscoveryMismatchGuard({ check, hasPassthrough: false })).toBe(true);
    });

    it('VALID: {discovered<files, no passthrough} => returns true', () => {
      const check = CheckResultStub({
        projectResults: [ProjectResultStub({ filesCount: 10, discoveredCount: 5 })],
      });

      expect(hasCheckDiscoveryMismatchGuard({ check, hasPassthrough: false })).toBe(true);
    });
  });

  describe('passthrough scoping', () => {
    it('VALID: {discovered>files, hasPassthrough, files>0} => returns false', () => {
      const check = CheckResultStub({
        projectResults: [ProjectResultStub({ filesCount: 9, discoveredCount: 209 })],
      });

      expect(hasCheckDiscoveryMismatchGuard({ check, hasPassthrough: true })).toBe(false);
    });

    it('VALID: {discovered>0 but files=0, hasPassthrough} => returns true (bad path)', () => {
      const check = CheckResultStub({
        projectResults: [ProjectResultStub({ filesCount: 0, discoveredCount: 209 })],
      });

      expect(hasCheckDiscoveryMismatchGuard({ check, hasPassthrough: true })).toBe(true);
    });
  });

  describe('zero discovered', () => {
    it('VALID: {discovered=0} => returns false', () => {
      const check = CheckResultStub({
        projectResults: [ProjectResultStub({ filesCount: 0, discoveredCount: 0 })],
      });

      expect(hasCheckDiscoveryMismatchGuard({ check, hasPassthrough: false })).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it('VALID: {check undefined} => returns false', () => {
      expect(hasCheckDiscoveryMismatchGuard({ hasPassthrough: false })).toBe(false);
    });

    it('VALID: {hasPassthrough undefined} => returns false', () => {
      const check = CheckResultStub();

      expect(hasCheckDiscoveryMismatchGuard({ check })).toBe(false);
    });
  });
});
