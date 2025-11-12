import { lintSeverityStatics } from './lint-severity-statics';

describe('lintSeverityStatics', () => {
  describe('with severity level values', () => {
    it('VALID: {} => warning severity is 1', () => {
      expect(lintSeverityStatics.warning).toBe(1);
    });

    it('VALID: {} => error severity is 2', () => {
      expect(lintSeverityStatics.error).toBe(2);
    });

    it('VALID: {} => contains both warning and error properties', () => {
      expect(lintSeverityStatics).toStrictEqual({
        warning: 1,
        error: 2,
      });
    });
  });
});
