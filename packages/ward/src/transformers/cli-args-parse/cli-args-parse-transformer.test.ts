import { CliArgStub } from '../../contracts/cli-arg/cli-arg.stub';

import { cliArgsParseTransformer } from './cli-args-parse-transformer';
import { cliArgsParseTransformerProxy } from './cli-args-parse-transformer.proxy';

describe('cliArgsParseTransformer', () => {
  describe('no flags', () => {
    it('EMPTY: {args: []} => returns empty config', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({});
    });
  });

  describe('--only flag', () => {
    it('VALID: {args: ["--only", "lint"]} => returns config with only lint', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'lint' })],
      });

      expect(result).toStrictEqual({ only: ['lint'] });
    });

    it('VALID: {args: ["--only", "lint,typecheck"]} => returns config with multiple check types', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'lint,typecheck' })],
      });

      expect(result).toStrictEqual({ only: ['lint', 'typecheck'] });
    });

    it('VALID: {args: ["--only", "lint", "--only", "typecheck"]} => accumulates repeated --only flags', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'lint' }),
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'typecheck' }),
        ],
      });

      expect(result).toStrictEqual({ only: ['lint', 'typecheck'] });
    });
  });

  describe('--only test alias expansion', () => {
    it('VALID: {args: ["--only", "test"]} => expands test to unit, integration, and e2e', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'test' })],
      });

      expect(result).toStrictEqual({ only: ['unit', 'integration', 'e2e'] });
    });

    it('VALID: {args: ["--only", "test,lint"]} => expands test and keeps lint', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'test,lint' })],
      });

      expect(result).toStrictEqual({ only: ['unit', 'integration', 'e2e', 'lint'] });
    });

    it('VALID: {args: ["--only", "test,e2e"]} => deduplicates e2e after expansion', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'test,e2e' })],
      });

      expect(result).toStrictEqual({ only: ['unit', 'integration', 'e2e'] });
    });

    it('VALID: {args: ["--only", "unit"]} => returns unit without expansion', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'unit' })],
      });

      expect(result).toStrictEqual({ only: ['unit'] });
    });

    it('VALID: {args: ["--only", "integration"]} => returns integration without expansion', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'integration' })],
      });

      expect(result).toStrictEqual({ only: ['integration'] });
    });
  });

  describe('--changed flag', () => {
    it('VALID: {args: ["--changed"]} => returns config with changed true', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--changed' })],
      });

      expect(result).toStrictEqual({ changed: true });
    });
  });

  describe('--verbose flag', () => {
    it('VALID: {args: ["--verbose"]} => returns config with verbose true', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--verbose' })],
      });

      expect(result).toStrictEqual({ verbose: true });
    });
  });

  describe('-- passthrough separator', () => {
    it('VALID: {args: ["--", "path/to/file.test.ts"]} => returns config with passthrough', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });

    it('VALID: {--only unit -- file1 file2} => returns config with only and passthrough', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'unit' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/a.test.ts' }),
          CliArgStub({ value: 'packages/ward/src/b.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['unit'],
        passthrough: ['packages/ward/src/a.test.ts', 'packages/ward/src/b.test.ts'],
      });
    });

    it('VALID: {-- with no files after} => returns config without passthrough', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--' })],
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('flags after -- are passthrough', () => {
    it('VALID: {--only test -- --only lint} => --only lint treated as passthrough, not parsed', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'test' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'lint' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['unit', 'integration', 'e2e'],
        passthrough: ['--only', 'lint'],
      });
    });
  });

  describe('all flags combined', () => {
    it('VALID: {--only test --changed --verbose -- file.ts} => returns complete config', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'test' }),
          CliArgStub({ value: '--changed' }),
          CliArgStub({ value: '--verbose' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/hooks/src/foo.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['unit', 'integration', 'e2e'],
        changed: true,
        verbose: true,
        passthrough: ['packages/hooks/src/foo.test.ts'],
      });
    });
  });

  describe('deduplication', () => {
    it('VALID: {--only test --only test} => deduplicates identical values', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'test' }),
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'test' }),
        ],
      });

      expect(result).toStrictEqual({ only: ['unit', 'integration', 'e2e'] });
    });

    it('VALID: {--only unit --only test} => deduplicates unit from test expansion', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'unit' }),
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'test' }),
        ],
      });

      expect(result).toStrictEqual({ only: ['unit', 'integration', 'e2e'] });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {args: ["--only", "badvalue"]} => throws validation error for invalid check type', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'badvalue' })],
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('EDGE: {args: ["--only"]} => only flag with no value is ignored', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--only' })],
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('combined flags', () => {
    it('VALID: {all flags} => returns config with all options', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'lint' }),
          CliArgStub({ value: '--changed' }),
          CliArgStub({ value: '--verbose' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['lint'],
        changed: true,
        verbose: true,
      });
    });
  });
});
