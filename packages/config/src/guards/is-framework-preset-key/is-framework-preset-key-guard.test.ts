import { isFrameworkPresetKeyGuard } from './is-framework-preset-key-guard';

describe('isFrameworkPresetKeyGuard', () => {
  describe('valid keys', () => {
    it('VALID: "widgets" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('widgets');

      expect(result).toBe(true);
    });

    it('VALID: "bindings" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('bindings');

      expect(result).toBe(true);
    });

    it('VALID: "state" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('state');

      expect(result).toBe(true);
    });

    it('VALID: "flows" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('flows');

      expect(result).toBe(true);
    });

    it('VALID: "responders" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('responders');

      expect(result).toBe(true);
    });

    it('VALID: "contracts" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('contracts');

      expect(result).toBe(true);
    });

    it('VALID: "brokers" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('brokers');

      expect(result).toBe(true);
    });

    it('VALID: "transformers" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('transformers');

      expect(result).toBe(true);
    });

    it('VALID: "errors" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('errors');

      expect(result).toBe(true);
    });

    it('VALID: "middleware" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('middleware');

      expect(result).toBe(true);
    });

    it('VALID: "adapters" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('adapters');

      expect(result).toBe(true);
    });

    it('VALID: "startup" => returns true', () => {
      const result = isFrameworkPresetKeyGuard('startup');

      expect(result).toBe(true);
    });
  });

  describe('invalid keys', () => {
    it('INVALID: "invalid" => returns false', () => {
      const result = isFrameworkPresetKeyGuard('invalid');

      expect(result).toBe(false);
    });

    it('INVALID: "guards" => returns false', () => {
      const result = isFrameworkPresetKeyGuard('guards');

      expect(result).toBe(false);
    });

    it('INVALID: "" => returns false', () => {
      const result = isFrameworkPresetKeyGuard('');

      expect(result).toBe(false);
    });

    it('INVALID: "WIDGETS" => returns false (case sensitive)', () => {
      const result = isFrameworkPresetKeyGuard('WIDGETS');

      expect(result).toBe(false);
    });
  });
});
