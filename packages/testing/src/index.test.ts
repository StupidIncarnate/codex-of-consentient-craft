/**
 * Tests for testing package exports
 */

import {
  TESTING_PACKAGE_VERSION,
  childProcessMockerAdapter,
  integrationEnvironmentCreateBroker,
  integrationEnvironmentCleanupAllBroker,
  integrationEnvironmentListBroker,
} from './index';

describe('testing package exports', () => {
  describe('TESTING_PACKAGE_VERSION', () => {
    it('VALID: exports version string => returns string', () => {
      expect(TESTING_PACKAGE_VERSION).toBe('0.1.0');
    });
  });

  describe('childProcessMockerAdapter', () => {
    it('VALID: exports childProcessMockerAdapter => is defined as function', () => {
      expect(childProcessMockerAdapter).toStrictEqual(expect.any(Function));
    });
  });

  describe('integrationEnvironmentCreateBroker', () => {
    it('VALID: exports integrationEnvironmentCreateBroker => is defined', () => {
      expect(integrationEnvironmentCreateBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('integrationEnvironmentCleanupAllBroker', () => {
    it('VALID: exports integrationEnvironmentCleanupAllBroker => is defined', () => {
      expect(integrationEnvironmentCleanupAllBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('integrationEnvironmentListBroker', () => {
    it('VALID: exports integrationEnvironmentListBroker => is defined', () => {
      expect(integrationEnvironmentListBroker).toStrictEqual(expect.any(Function));
    });
  });
});
