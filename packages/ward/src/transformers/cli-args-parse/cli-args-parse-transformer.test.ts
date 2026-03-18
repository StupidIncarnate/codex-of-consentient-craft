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

  describe('--onlyTests flag', () => {
    it('VALID: {args: ["--onlyTests", "my test"]} => returns config with onlyTests pattern', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--onlyTests' }), CliArgStub({ value: 'my test' })],
      });

      expect(result).toStrictEqual({ onlyTests: 'my test' });
    });

    it('VALID: {args: ["--onlyTests", "foo|bar|baz"]} => supports regex alternation', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--onlyTests' }), CliArgStub({ value: 'foo|bar|baz' })],
      });

      expect(result).toStrictEqual({ onlyTests: 'foo|bar|baz' });
    });

    it('VALID: {args: ["--only", "unit", "--onlyTests", "my test"]} => combines with --only', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'unit' }),
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
        ],
      });

      expect(result).toStrictEqual({ only: ['unit'], onlyTests: 'my test' });
    });

    it('EDGE: {args: ["--onlyTests"]} => onlyTests with no value is ignored', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--onlyTests' })],
      });

      expect(result).toStrictEqual({});
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

  describe('flags after -- are rejected', () => {
    it('REJECT: {--only test -- --only lint} => flags after separator are rejected', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [
            CliArgStub({ value: '--only' }),
            CliArgStub({ value: 'test' }),
            CliArgStub({ value: '--' }),
            CliArgStub({ value: '--only' }),
            CliArgStub({ value: 'lint' }),
          ],
        }),
      ).toThrow(/Flags after "--" are not forwarded/u);
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

  describe('unknown flags reject with helpful error', () => {
    describe('jest flags', () => {
      it.each([
        ['--watch'],
        ['--watchAll'],
        ['--bail'],
        ['--coverage'],
        ['--testNamePattern'],
        ['-t'],
        ['--runInBand'],
        ['--findRelatedTests'],
        ['--forceExit'],
        ['--detectOpenHandles'],
        ['--maxWorkers'],
        ['--json'],
        ['--no-color'],
        ['--listTests'],
        ['--showConfig'],
        ['--passWithNoTests'],
        ['--silent'],
        ['--testPathPattern'],
        ['--testPathIgnorePatterns'],
        ['--clearCache'],
        ['--changedSince'],
        ['--collectCoverageFrom'],
        ['--updateSnapshot'],
        ['-u'],
        ['--ci'],
        ['--noStackTrace'],
        ['--expand'],
        ['-e'],
      ])('REJECT: jest flag %s => throws unknown flag error', (flag) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: flag })],
          }),
        ).toThrow(/Unknown flag/u);
      });
    });

    describe('eslint flags', () => {
      it.each([
        ['--fix'],
        ['--fix-dry-run'],
        ['--quiet'],
        ['--format'],
        ['-f'],
        ['--ext'],
        ['--no-eslintrc'],
        ['--config'],
        ['-c'],
        ['--rule'],
        ['--rulesdir'],
        ['--ignore-path'],
        ['--no-ignore'],
        ['--max-warnings'],
        ['--cache'],
        ['--no-cache'],
        ['--cache-location'],
        ['--debug'],
        ['--output-file'],
        ['-o'],
        ['--color'],
        ['--no-color'],
        ['--parser'],
        ['--resolve-plugins-relative-to'],
      ])('REJECT: eslint flag %s => throws unknown flag error', (flag) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: flag })],
          }),
        ).toThrow(/Unknown flag/u);
      });
    });

    describe('tsc flags', () => {
      it.each([
        ['--noEmit'],
        ['--project'],
        ['-p'],
        ['--strict'],
        ['--build'],
        ['-b'],
        ['--declaration'],
        ['-d'],
        ['--emitDeclarationOnly'],
        ['--outDir'],
        ['--target'],
        ['--module'],
        ['--moduleResolution'],
        ['--esModuleInterop'],
        ['--skipLibCheck'],
        ['--incremental'],
        ['--watch'],
        ['-w'],
        ['--pretty'],
        ['--listEmittedFiles'],
        ['--diagnostics'],
        ['--extendedDiagnostics'],
        ['--traceResolution'],
        ['--noErrorTruncation'],
        ['--composite'],
      ])('REJECT: tsc flag %s => throws unknown flag error', (flag) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: flag })],
          }),
        ).toThrow(/Unknown flag/u);
      });
    });

    describe('playwright flags', () => {
      it.each([
        ['--headed'],
        ['--debug'],
        ['--ui'],
        ['--reporter'],
        ['--retries'],
        ['--timeout'],
        ['--grep'],
        ['-g'],
        ['--workers'],
        ['-j'],
        ['--project'],
        ['--shard'],
        ['--repeat-each'],
        ['--list'],
        ['--forbid-only'],
        ['--global-timeout'],
        ['--update-snapshots'],
        ['--output'],
        ['--trace'],
        ['--browser'],
      ])('REJECT: playwright flag %s => throws unknown flag error', (flag) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: flag })],
          }),
        ).toThrow(/Unknown flag/u);
      });
    });

    describe('random/nonsense flags', () => {
      it.each([
        ['--donut'],
        ['-d'],
        ['-x'],
        ['--foo'],
        ['--bar-baz'],
        ['-abc'],
        ['--help'],
        ['-h'],
        ['--version'],
        ['-v'],
        ['-V'],
        ['--dry-run'],
        ['--force'],
        ['--recursive'],
        ['-r'],
        ['--all'],
        ['-a'],
        ['--yes'],
        ['-y'],
        ['--no-verify'],
        ['--skip'],
        ['--parallel'],
        ['--serial'],
        ['--env'],
        ['--config'],
        ['--init'],
        ['--reset'],
      ])('REJECT: random flag %s => throws unknown flag error', (flag) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: flag })],
          }),
        ).toThrow(/Unknown flag/u);
      });
    });

    describe('positional arguments without separator', () => {
      it.each([
        ['path/to/file.test.ts'],
        ['packages/ward'],
        ['src/index.ts'],
        ['file.ts'],
        ['some-random-word'],
      ])('REJECT: positional arg "%s" without -- separator => throws', (arg) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: arg })],
          }),
        ).toThrow(/Unexpected positional argument/u);
      });
    });

    describe('error message quality', () => {
      it('REJECT: unknown flag error includes the flag name', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: '--coverage' })],
          }),
        ).toThrow(/--coverage/u);
      });

      it('REJECT: unknown flag error includes usage hint', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: '--watch' })],
          }),
        ).toThrow(/Usage:/u);
      });

      it('REJECT: positional arg error includes separator hint', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: 'file.test.ts' })],
          }),
        ).toThrow(/after "--" separator/u);
      });

      it('REJECT: unknown flag mixed with valid flags still throws', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: '--only' }),
              CliArgStub({ value: 'unit' }),
              CliArgStub({ value: '--bail' }),
            ],
          }),
        ).toThrow(/Unknown flag: --bail/u);
      });
    });

    describe('flags after -- separator are also rejected', () => {
      it('REJECT: jest flags after -- are rejected as non-file-path args', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: '--' }),
              CliArgStub({ value: '--watch' }),
              CliArgStub({ value: '--bail' }),
            ],
          }),
        ).toThrow(/Flags after "--" are not forwarded.*--watch.*--bail/su);
      });

      it('REJECT: mixed files and flags after -- rejects the flags', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: '--' }),
              CliArgStub({ value: 'path/to/file.test.ts' }),
              CliArgStub({ value: '--verbose' }),
            ],
          }),
        ).toThrow(/Flags after "--" are not forwarded.*--verbose/su);
      });

      it('REJECT: short flags after -- are also rejected', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: '--' }),
              CliArgStub({ value: '-t' }),
              CliArgStub({ value: 'my test name' }),
            ],
          }),
        ).toThrow(/Flags after "--" are not forwarded.*-t/su);
      });

      it('REJECT: passthrough error mentions flags are not forwarded to tools', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: '--only' }),
              CliArgStub({ value: 'unit' }),
              CliArgStub({ value: '--' }),
              CliArgStub({ value: '--coverage' }),
            ],
          }),
        ).toThrow(/Ward does not support passing flags to Jest/u);
      });
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
