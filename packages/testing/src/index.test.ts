/**
 * Tests for testing package exports
 */

import {
  TESTING_PACKAGE_VERSION,
  ChildProcessMocker,
  createIntegrationEnvironment,
  cleanupAllEnvironments,
  getCreatedEnvironments,
} from './index';

describe('testing package exports', () => {
  describe('TESTING_PACKAGE_VERSION', () => {
    it('VALID: exports version string => returns string', () => {
      expect(typeof TESTING_PACKAGE_VERSION).toBe('string');
      expect(TESTING_PACKAGE_VERSION).toBe('0.1.0');
    });
  });

  describe('ChildProcessMocker', () => {
    it('VALID: exports ChildProcessMocker => is defined', () => {
      expect(ChildProcessMocker).toBeDefined();
      expect(typeof ChildProcessMocker).toBe('function');
    });
  });

  describe('createIntegrationEnvironment', () => {
    it('VALID: exports createIntegrationEnvironment => is defined', () => {
      expect(createIntegrationEnvironment).toBeDefined();
      expect(typeof createIntegrationEnvironment).toBe('function');
    });
  });

  describe('cleanupAllEnvironments', () => {
    it('VALID: exports cleanupAllEnvironments => is defined', () => {
      expect(cleanupAllEnvironments).toBeDefined();
      expect(typeof cleanupAllEnvironments).toBe('function');
    });
  });

  describe('getCreatedEnvironments', () => {
    it('VALID: exports getCreatedEnvironments => is defined', () => {
      expect(getCreatedEnvironments).toBeDefined();
      expect(typeof getCreatedEnvironments).toBe('function');
    });
  });
});
