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
    it('VALID: {args: ["--onlyTests", "my test", "--", "file.ts"]} => returns config with onlyTests pattern', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        onlyTests: 'my test',
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });

    it('VALID: {args: ["--onlyTests", "foo|bar|baz", "--", "file.ts"]} => supports regex alternation', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'foo|bar|baz' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        onlyTests: 'foo|bar|baz',
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });

    it('VALID: {args: ["--only", "unit", "--onlyTests", "my test", "--", "file.ts"]} => combines with --only', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'unit' }),
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['unit'],
        onlyTests: 'my test',
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });

    it('EDGE: {args: ["--onlyTests"]} => onlyTests with no value is ignored', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--onlyTests' })],
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('--onlyTests requires a file scope', () => {
    it('INVALID: {--onlyTests "my test"} => throws because nothing scopes the run to files', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [CliArgStub({ value: '--onlyTests' }), CliArgStub({ value: 'my test' })],
        }),
      ).toThrow(/^--onlyTests requires a file scope: add -- <files>$/mu);
    });

    it('INVALID: {--only unit --onlyTests "my test"} => --only is a check filter, not a file scope', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [
            CliArgStub({ value: '--only' }),
            CliArgStub({ value: 'unit' }),
            CliArgStub({ value: '--onlyTests' }),
            CliArgStub({ value: 'my test' }),
          ],
        }),
      ).toThrow(/^--onlyTests requires a file scope: add -- <files>$/mu);
    });

    it('INVALID: {--onlyTests "my test" --} => a bare separator sets no file scope and is rejected', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [
            CliArgStub({ value: '--onlyTests' }),
            CliArgStub({ value: 'my test' }),
            CliArgStub({ value: '--' }),
          ],
        }),
      ).toThrow(/^--onlyTests requires a file scope: add -- <files>$/mu);
    });

    it('INVALID: {--onlyTests "my test"} => error shows the scoped invocation to use instead', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [CliArgStub({ value: '--onlyTests' }), CliArgStub({ value: 'my test' })],
        }),
      ).toThrow(
        /^ {2}npm run ward -- --only unit --onlyTests "my test" -- packages\/ward\/src\/foo\.test\.ts$/mu,
      );
    });

    it('VALID: {--onlyTests "my test" -- file.ts} => a file list scopes the run and it is accepted', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        onlyTests: 'my test',
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });
  });

  describe('--parentScoped exempts a child ward from the file-scope rule', () => {
    it('VALID: {--only unit --onlyTests "my test" --parentScoped} => accepted without a file list', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'unit' }),
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
          CliArgStub({ value: '--parentScoped' }),
        ],
      });

      expect(result).toStrictEqual({ only: ['unit'], onlyTests: 'my test' });
    });

    it('VALID: {--parentScoped} => the marker leaves no trace in the config', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--parentScoped' })],
      });

      expect(result).toStrictEqual({});
    });

    it('VALID: {--onlyTests "my test" --parentScoped -- file.ts} => a file list still lands as passthrough', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
          CliArgStub({ value: '--parentScoped' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        onlyTests: 'my test',
        passthrough: ['src/index.test.ts'],
      });
    });

    it('INVALID: {--staged --onlyTests "my test" --parentScoped} => the git scope rejection still wins', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [
            CliArgStub({ value: '--staged' }),
            CliArgStub({ value: '--onlyTests' }),
            CliArgStub({ value: 'my test' }),
            CliArgStub({ value: '--parentScoped' }),
          ],
        }),
      ).toThrow(/^--staged cannot be combined with: --onlyTests$/mu);
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

  describe('--staged flag', () => {
    it('VALID: {args: ["--staged"]} => returns config with staged true', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--staged' })],
      });

      expect(result).toStrictEqual({ staged: true });
    });

    it('VALID: {args: ["--staged", "--staged"]} => repeating the flag stays a single true', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--staged' }), CliArgStub({ value: '--staged' })],
      });

      expect(result).toStrictEqual({ staged: true });
    });

    it('VALID: {args: ["--staged", "--"]} => a bare separator adds no file scope and is accepted', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [CliArgStub({ value: '--staged' }), CliArgStub({ value: '--' })],
      });

      expect(result).toStrictEqual({ staged: true });
    });
  });

  describe('git scope flags reject every narrowing flag', () => {
    describe.each([['--staged'], ['--changed']])('%s', (scopeFlag) => {
      it(`INVALID: {${scopeFlag} --only lint} => throws naming --only`, () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: scopeFlag }),
              CliArgStub({ value: '--only' }),
              CliArgStub({ value: 'lint' }),
            ],
          }),
        ).toThrow(new RegExp(`^${scopeFlag} cannot be combined with: --only$`, 'mu'));
      });

      it(`INVALID: {--only lint ${scopeFlag}} => throws regardless of flag order`, () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: '--only' }),
              CliArgStub({ value: 'lint' }),
              CliArgStub({ value: scopeFlag }),
            ],
          }),
        ).toThrow(new RegExp(`^${scopeFlag} cannot be combined with: --only$`, 'mu'));
      });

      it(`INVALID: {${scopeFlag} --onlyTests "my test"} => throws naming --onlyTests`, () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: scopeFlag }),
              CliArgStub({ value: '--onlyTests' }),
              CliArgStub({ value: 'my test' }),
            ],
          }),
        ).toThrow(new RegExp(`^${scopeFlag} cannot be combined with: --onlyTests$`, 'mu'));
      });

      it(`INVALID: {${scopeFlag} -- file.ts} => throws naming the file list`, () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: scopeFlag }),
              CliArgStub({ value: '--' }),
              CliArgStub({ value: 'packages/ward/src/index.ts' }),
            ],
          }),
        ).toThrow(new RegExp(`^${scopeFlag} cannot be combined with: -- <files>$`, 'mu'));
      });

      it(`INVALID: {${scopeFlag} --only lint --onlyTests "x" -- file.ts} => names all three conflicts`, () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: scopeFlag }),
              CliArgStub({ value: '--only' }),
              CliArgStub({ value: 'lint' }),
              CliArgStub({ value: '--onlyTests' }),
              CliArgStub({ value: 'x' }),
              CliArgStub({ value: '--' }),
              CliArgStub({ value: 'packages/ward/src/index.ts' }),
            ],
          }),
        ).toThrow(
          new RegExp(
            `^${scopeFlag} cannot be combined with: --only, --onlyTests, -- <files>$`,
            'mu',
          ),
        );
      });

      it(`INVALID: {${scopeFlag} --only lint} => error shows the standalone invocation to use instead`, () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [
              CliArgStub({ value: scopeFlag }),
              CliArgStub({ value: '--only' }),
              CliArgStub({ value: 'lint' }),
            ],
          }),
        ).toThrow(new RegExp(`^ {2}npm run ward -- ${scopeFlag}$`, 'mu'));
      });
    });
  });

  describe('--changed and --staged are mutually exclusive', () => {
    it('INVALID: {--staged --changed} => throws because both pick the file set from git', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [CliArgStub({ value: '--staged' }), CliArgStub({ value: '--changed' })],
        }),
      ).toThrow(/^--changed and --staged cannot be combined\.$/mu);
    });

    it('INVALID: {--changed --staged} => throws regardless of flag order', () => {
      cliArgsParseTransformerProxy();

      expect(() =>
        cliArgsParseTransformer({
          args: [CliArgStub({ value: '--changed' }), CliArgStub({ value: '--staged' })],
        }),
      ).toThrow(/^--changed and --staged cannot be combined\.$/mu);
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
    it('INVALID: {--only test -- --only lint} => flags after separator are rejected', () => {
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

  describe('all narrowing flags combined', () => {
    it('VALID: {--only test --onlyTests "x" -- file.ts} => returns complete config', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'test' }),
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'validates input' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/hooks/src/foo.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['unit', 'integration', 'e2e'],
        onlyTests: 'validates input',
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
      ])('INVALID: jest flag %s => throws unknown flag error', (flag) => {
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
      ])('INVALID: eslint flag %s => throws unknown flag error', (flag) => {
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
      ])('INVALID: tsc flag %s => throws unknown flag error', (flag) => {
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
      ])('INVALID: playwright flag %s => throws unknown flag error', (flag) => {
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
      ])('INVALID: random flag %s => throws unknown flag error', (flag) => {
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
      ])('INVALID: positional arg "%s" without -- separator => throws', (arg) => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: arg })],
          }),
        ).toThrow(/Unexpected positional argument/u);
      });
    });

    describe('error message quality', () => {
      it('INVALID: unknown flag error includes the flag name', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: '--coverage' })],
          }),
        ).toThrow(/--coverage/u);
      });

      it('INVALID: unknown flag error includes usage hint', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: '--watch' })],
          }),
        ).toThrow(/Usage:/u);
      });

      it('INVALID: positional arg error includes separator hint', () => {
        cliArgsParseTransformerProxy();

        expect(() =>
          cliArgsParseTransformer({
            args: [CliArgStub({ value: 'file.test.ts' })],
          }),
        ).toThrow(/after "--" separator/u);
      });

      it('INVALID: unknown flag mixed with valid flags still throws', () => {
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
      it('INVALID: jest flags after -- are rejected as non-file-path args', () => {
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

      it('INVALID: mixed files and flags after -- rejects the flags', () => {
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

      it('INVALID: short flags after -- are also rejected', () => {
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

      it('INVALID: passthrough error mentions flags are not forwarded to tools', () => {
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
    it('VALID: {--only lint --onlyTests "x" -- file.ts} => returns config with all three options', () => {
      cliArgsParseTransformerProxy();

      const result = cliArgsParseTransformer({
        args: [
          CliArgStub({ value: '--only' }),
          CliArgStub({ value: 'lint' }),
          CliArgStub({ value: '--onlyTests' }),
          CliArgStub({ value: 'my test' }),
          CliArgStub({ value: '--' }),
          CliArgStub({ value: 'packages/ward/src/index.test.ts' }),
        ],
      });

      expect(result).toStrictEqual({
        only: ['lint'],
        onlyTests: 'my test',
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });
  });
});
