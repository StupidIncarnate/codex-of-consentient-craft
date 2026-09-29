import { staticsStringPropertyTransformer } from './statics-string-property-transformer';

describe('staticsStringPropertyTransformer', () => {
  describe('plain top-level string property', () => {
    it("VALID: {export const bundleStatics = { buildCommand: 'npm' } as const} => returns 'npm'", () => {
      const source = "export const bundleStatics = {\n  buildCommand: 'npm',\n} as const;\n";

      expect(
        staticsStringPropertyTransformer({
          source,
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
        }),
      ).toBe('npm');
    });

    it('VALID: {double-quoted value, quoted key} => returns the value', () => {
      const source = 'export const x = { "cmd": "lsof" };';

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe('lsof');
    });

    it('VALID: {type annotation before the equals sign} => returns the value', () => {
      const source = "export const x: Readonly<Record<string, string>> = { cmd: 'git' };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe('git');
    });

    it('VALID: {property follows a nested object, array and function call} => returns the value', () => {
      const source =
        "export const x = { list: ['a', 'b'], nested: { cmd: 'kill' }, fn: call({ a: 1 }), cmd: 'git' };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe('git');
    });
  });

  describe('braces and quotes that are not structure', () => {
    it("VALID: {a comment and a string both hold an unbalanced '{'} => still reads the later property", () => {
      const source =
        "export const x = {\n  // opens a { that never closes\n  glob: 'src/{a,b',\n  /* another { */\n  cmd: 'npm',\n};";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe('npm');
    });

    it('VALID: {a URL with // inside a string} => is not read as a comment', () => {
      const source = "export const x = { url: 'http://a', cmd: 'claude' };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe('claude');
    });
  });

  describe('not resolvable', () => {
    it('EMPTY: {the property exists only inside a nested object} => returns undefined', () => {
      const source = "export const x = { nested: { cmd: 'git' } };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe(undefined);
    });

    it('EMPTY: {the value is an identifier, not a string} => returns undefined', () => {
      const source = 'export const x = { cmd: someValue };';

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe(undefined);
    });

    it('EMPTY: {the value is a template with a substitution} => returns undefined', () => {
      const dollar = '$';
      const source = `export const x = { cmd: \`git ${dollar}{flag}\` };`;

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe(undefined);
    });

    it('EMPTY: {the object is not exported} => returns undefined', () => {
      const source = "const x = { cmd: 'git' };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe(undefined);
    });

    it('EMPTY: {a different object holds the property} => returns undefined', () => {
      const source = "export const other = { cmd: 'git' };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe(undefined);
    });

    it('EMPTY: {objectName is not an identifier} => returns undefined', () => {
      expect(
        staticsStringPropertyTransformer({
          source: "export const x = { cmd: 'git' };",
          objectName: 'x.*',
          propertyName: 'cmd',
        }),
      ).toBe(undefined);
    });

    it('EMPTY: {empty string value} => returns undefined', () => {
      const source = "export const x = { cmd: '' };";

      expect(
        staticsStringPropertyTransformer({ source, objectName: 'x', propertyName: 'cmd' }),
      ).toBe(undefined);
    });
  });
});
