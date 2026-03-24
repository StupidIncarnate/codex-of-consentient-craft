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
      expect(typeof TESTING_PACKAGE_VERSION).toBe('string');
      expect(TESTING_PACKAGE_VERSION).toBe('0.1.0');
    });
  });

  describe('childProcessMockerAdapter', () => {
    it('VALID: exports childProcessMockerAdapter => is defined as function', () => {
      expect(typeof childProcessMockerAdapter).toBe('function');
    });
  });

  describe('integrationEnvironmentCreateBroker', () => {
    it('VALID: exports integrationEnvironmentCreateBroker => is defined', () => {
      expect(typeof integrationEnvironmentCreateBroker).toBe('function');
    });
  });

  describe('integrationEnvironmentCleanupAllBroker', () => {
    it('VALID: exports integrationEnvironmentCleanupAllBroker => is defined', () => {
      expect(typeof integrationEnvironmentCleanupAllBroker).toBe('function');
    });
  });

  describe('integrationEnvironmentListBroker', () => {
    it('VALID: exports integrationEnvironmentListBroker => is defined', () => {
      expect(typeof integrationEnvironmentListBroker).toBe('function');
    });
  });
});
