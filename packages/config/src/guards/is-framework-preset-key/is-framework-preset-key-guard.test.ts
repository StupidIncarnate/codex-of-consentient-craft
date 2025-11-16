import { isFrameworkPresetKeyGuard } from './is-framework-preset-key-guard';

describe('isFrameworkPresetKeyGuard', () => {
  describe('valid keys', () => {
    it('VALID: {key: "widgets"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'widgets' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "bindings"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'bindings' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "state"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'state' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "flows"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'flows' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "responders"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'responders' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "contracts"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'contracts' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "brokers"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'brokers' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "transformers"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'transformers' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "errors"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'errors' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "middleware"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'middleware' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "adapters"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'adapters' });

      expect(result).toBe(true);
    });

    it('VALID: {key: "startup"} => returns true', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'startup' });

      expect(result).toBe(true);
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {key: "invalid"} => returns false', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'invalid' });

      expect(result).toBe(false);
    });

    it('INVALID: {key: "guards"} => returns false', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'guards' });

      expect(result).toBe(false);
    });

    it('INVALID: {key: ""} => returns false', () => {
      const result = isFrameworkPresetKeyGuard({ key: '' });

      expect(result).toBe(false);
    });

    it('INVALID: {key: "WIDGETS"} => returns false (case sensitive)', () => {
      const result = isFrameworkPresetKeyGuard({ key: 'WIDGETS' });

      expect(result).toBe(false);
    });
  });
});
